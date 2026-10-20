import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSessionActor } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { actor, revoked } = await resolveSessionActor(req);
  if (revoked) {
    return NextResponse.json({ error: "Account has been revoked." }, { status: 403 });
  }
  if (!actor) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;
  let page = await prisma.designPage.findUnique({
    where: { id },
    include: {
      designSystem: true,
      screens: { orderBy: { createdAt: "asc" } },
      flowcharts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!page && (id === "page-fintech-command" || id === "default")) {
    page = await prisma.designPage.findFirst({
      orderBy: { updatedAt: "desc" },
      include: {
        designSystem: true,
        screens: { orderBy: { createdAt: "asc" } },
        flowcharts: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  if (!page) {
    return NextResponse.json({ error: "Design page not found." }, { status: 404 });
  }

  const slug = page.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const files: Record<string, string> = {
    "package.json": JSON.stringify(
      {
        name: `uxpilot-export-${slug || "project"}`,
        version: "1.0.0",
        private: true,
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          "lucide-react": "^1.0.0",
          tailwindcss: "^3.4.0",
        },
      },
      null,
      2
    ),
    "DESIGN.md":
      page.designSystem?.designMd ||
      `# ${page.name} — Design Specification\n\n- Platform: ${page.platform}\n- Fidelity: ${page.mode}\n`,
  };

  page.screens.forEach((s, idx) => {
    const safeName =
      s.name.replace(/[^a-zA-Z0-9]+/g, "") || `Screen${idx + 1}`;
    files[`src/screens/${safeName}.tsx`] = s.reactCode;
    files[`public/screens/${safeName}.html`] = s.htmlContent;
  });

  const bundle = {
    ok: true,
    pageId: page.id,
    pageName: page.name,
    platform: page.platform,
    mode: page.mode,
    exportedAt: new Date().toISOString(),
    fileCount: Object.keys(files).length,
    files,
  };

  if (req.nextUrl.searchParams.get("format") === "download") {
    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug || "uxpilot"}-bundle.json"`,
      },
    });
  }

  return NextResponse.json(bundle);
}
