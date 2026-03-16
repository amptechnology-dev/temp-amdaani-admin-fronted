import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token")?.value || null; // get cookie
  const { pathname } = request.nextUrl;

  // Define protected and public routes
  const protectedRoutes = ["/dashboard"];
  const publicRoutes = ["/login", "/auth/login"];

  // Check if path matches
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isPublicRoute = publicRoutes.includes(pathname);

  // 🚫 Redirect unauthenticated user trying to access protected route
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 🔑 Redirect authenticated user trying to access public route
  if (isPublicRoute && token) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Run middleware on these routes
export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/auth/login"],
};
