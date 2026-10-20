import { NextRequest, NextResponse } from "next/server";
import { registerUserWithInvitation, validateInvitationCode } from "@/lib/invitations";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  const email = req.nextUrl.searchParams.get("email") || undefined;
  const result = await validateInvitationCode(code, email);
  if (!result.valid) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await registerUserWithInvitation({
      code: body.invitationCode || body.code || "",
      email: body.email || "",
      name: body.name || "",
      password: body.password || "",
    });
    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
