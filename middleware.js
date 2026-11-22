import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAuthApi = pathname.startsWith("/api/auth");
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(.*)$/.test(pathname);

  if (isAuthApi || isPublicAsset) {
    return NextResponse.next();
  }

  if (!sessionToken) {
    if (isAuthPage) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    const targetUrl = pathname + search;
    const safeTarget =
      targetUrl.startsWith("/") && !targetUrl.startsWith("//") ? targetUrl : "/";

    const loginUrl = new URL("/login", request.url);
    if (safeTarget !== "/") {
      loginUrl.searchParams.set("callbackUrl", safeTarget);
    }

    return NextResponse.redirect(loginUrl);
  }

  if (sessionToken && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
