import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip auth checks for sign-in page, API routes, and static assets
  if (
    pathname.startsWith("/sign-in") || 
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/set-password") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") || 
    pathname.includes(".") // skip files with extensions like .css, .svg, .js
  ) {
    return NextResponse.next();
  }

  // A cheap, optimistic check for Better Auth session cookie presence
  // Note: Actual secure authorization happens in Server Actions / requireRole()
  const sessionToken = request.cookies.get("better-auth.session_token")?.value || 
                       request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except api, _next/static, _next/image, and favicon
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
