import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSessionActor, hasMinimumRole } from "@/lib/api-auth";
import { getAIProvider } from "@/lib/ai/provider";

const MCP_TOOLS = [
  {
    name: "list_design_pages",
    description: "List UX Pilot Studio design files, screens, and fidelity modes in the workspace.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max pages to return (default 10)" },
      },
    },
  },
  {
    name: "get_design_system_tokens",
    description: "Retrieve semantic color tokens, typography scale, and DESIGN.md specification.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Optional design system name filter" },
      },
    },
  },
  {
    name: "generate_ui_screen",
    description: "Synthesize a new Hi-Fi UI or Wireframe screen with HTML5 and React TSX output.",
    inputSchema: {
      type: "object",
      required: ["prompt"],
      properties: {
        prompt: { type: "string" },
        platform: { type: "string", enum: ["mobile", "desktop"] },
        fidelity: { type: "string", enum: ["hifi", "wireframe"] },
      },
    },
  },
];

export async function GET() {
  return NextResponse.json({
    protocol: "model-context-protocol",
    version: "2025-03-26",
    serverInfo: {
      name: "uxpilot-studio-mcp",
      version: "2.0.0",
    },
    tools: MCP_TOOLS,
  });
}

export async function POST(req: NextRequest) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32001, message: "Account has been revoked." }, id: null },
      { status: 403 }
    );
  }
  if (!actor) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Unauthorized. Provide Authorization: Bearer uxp_mcp_<token> or session cookie.",
        },
        id: null,
      },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const rpcId = body.id ?? 1;
  const method = String(body.method || "tools/list");

  if (method === "initialize") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: rpcId,
      result: {
        protocolVersion: "2025-03-26",
        serverInfo: { name: "uxpilot-studio-mcp", version: "2.0.0" },
        capabilities: { tools: {} },
      },
    });
  }

  if (method === "tools/list") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: rpcId,
      result: { tools: MCP_TOOLS },
    });
  }

  if (method === "tools/call") {
    const toolName = body.params?.name;
    const args = body.params?.arguments || {};

    if (toolName === "list_design_pages") {
      const pages = await prisma.designPage.findMany({
        take: Math.min(25, Number(args.limit) || 10),
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { screens: true } } },
      });
      return NextResponse.json({
        jsonrpc: "2.0",
        id: rpcId,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                pages.map((p) => ({
                  id: p.id,
                  name: p.name,
                  platform: p.platform,
                  mode: p.mode,
                  screenCount: p._count.screens,
                }))
              ),
            },
          ],
        },
      });
    }

    if (toolName === "get_design_system_tokens") {
      const ds = await prisma.designSystem.findFirst({
        where: args.name ? { name: { contains: String(args.name) } } : undefined,
        orderBy: { updatedAt: "desc" },
      });
      return NextResponse.json({
        jsonrpc: "2.0",
        id: rpcId,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                name: ds?.name || "Default Design System",
                tokens: JSON.parse(ds?.tokensJson || "{}"),
                designMd: ds?.designMd || "",
              }),
            },
          ],
        },
      });
    }

    if (toolName === "generate_ui_screen") {
      if (!hasMinimumRole(actor.role, "Editor")) {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id: rpcId,
            error: { code: -32003, message: "Editor role required to generate screens." },
          },
          { status: 403 }
        );
      }
      const provider = getAIProvider();
      const result = await provider.generateScreens({
        prompt: String(args.prompt || "SaaS analytics dashboard"),
        platform: args.platform === "mobile" ? "mobile" : "desktop",
        fidelity: args.fidelity === "wireframe" ? "wireframe" : "hifi",
        generationKind: "standard",
        count: 1,
      });
      return NextResponse.json({
        jsonrpc: "2.0",
        id: rpcId,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                providerUsed: result.providerUsed,
                screen: result.screens[0],
              }),
            },
          ],
        },
      });
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: rpcId,
        error: { code: -32601, message: `Unknown MCP tool: ${toolName}` },
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: rpcId,
      error: { code: -32601, message: `Unsupported JSON-RPC method: ${method}` },
    },
    { status: 400 }
  );
}
