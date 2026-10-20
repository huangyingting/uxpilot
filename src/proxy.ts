import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/a/")) {
    const token = await getToken({
      req,
      secret:
        process.env.NEXTAUTH_SECRET || "uxpilot-super-secret-nextauth-jwt-key-2026",
    });

    if (!token || token.status === "REVOKED") {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      if (token?.status === "REVOKED") {
        signInUrl.searchParams.set("error", "ACCOUNT_REVOKED");
      }
      return NextResponse.redirect(signInUrl);
    }

    if (pathname.startsWith("/a/admin") && token.role !== "Admin") {
      return NextResponse.redirect(new URL("/a/ui-list?error=admin_required", req.url));
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  return res;
}

export const config = {
  matcher: ["/a/:path*", "/api/:path*"],
};
