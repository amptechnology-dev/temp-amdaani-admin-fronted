import { NextResponse } from "next/server";

export async function middleware(
  request
) {
  const token =
    request.cookies.get(
      "token"
    )?.value || null;

  const { pathname } =
    request.nextUrl;

  const protectedRoutes =
    ["/dashboard"];

  const publicRoutes = [
    "/login",
    "/auth/login",
  ];

  const isProtectedRoute =
    protectedRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(
          route + "/"
        )
    );

  const isPublicRoute =
    publicRoutes.includes(
      pathname
    );

  let isAuthenticated =
    false;

  // Verify token with backend
  if (token) {
    try {

      const response =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-session`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            cache:
              "no-store",
          }
        );

      isAuthenticated =
        response.ok;

    } catch (error) {
      isAuthenticated =
        false;
    }
  }

  // Protected route check
  if (
    isProtectedRoute &&
    !isAuthenticated
  ) {

    const response =
      NextResponse.redirect(
        new URL(
          "/login",
          request.url
        )
      );

    // Remove invalid cookie
    response.cookies.delete(
      "token"
    );

    return response;
  }

  // Public route check
  if (
    isPublicRoute &&
    isAuthenticated
  ) {
    return NextResponse.redirect(
      new URL(
        "/dashboard",
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/login",
    "/auth/login",
  ],
};