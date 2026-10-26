import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const roleCookie = request.cookies.get("vokalink_role")?.value;
  const tokenExists = request.cookies.get("vokalink_token_exists")?.value === "true";

  const isSchoolRoute = pathname.startsWith("/school");
  const isTeacherRoute = pathname.startsWith("/teacher");
  const isStudentRoute = pathname.startsWith("/student");
  const isLoginRoute = pathname === "/login";

  // 1. Cek proteksi rute privat (/school, /teacher, /student)
  if (isSchoolRoute || isTeacherRoute || isStudentRoute) {
    // Jika tidak ada token sama sekali -> arahkan ke login
    if (!tokenExists && !roleCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Jika ada role cookie tapi salah hak akses -> arahkan ke 403 Forbidden
    if (roleCookie) {
      if (isSchoolRoute && roleCookie !== "SCHOOL_ADMIN") {
        return NextResponse.redirect(new URL("/forbidden", request.url));
      }
      if (isTeacherRoute && roleCookie !== "TEACHER") {
        return NextResponse.redirect(new URL("/forbidden", request.url));
      }
      if (isStudentRoute && roleCookie !== "STUDENT") {
        return NextResponse.redirect(new URL("/forbidden", request.url));
      }
    }
  }

  // 2. Jika sudah login dan mencoba buka /login -> arahkan ke dashboard masing-masing
  if (isLoginRoute && roleCookie && tokenExists) {
    if (roleCookie === "SCHOOL_ADMIN") {
      return NextResponse.redirect(new URL("/school/dashboard", request.url));
    }
    if (roleCookie === "TEACHER") {
      return NextResponse.redirect(new URL("/teacher/heatmap", request.url));
    }
    if (roleCookie === "STUDENT") {
      return NextResponse.redirect(new URL("/student/home", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons (PWA icons)
     * - v/ (Mentor zero-login verification)
     * - verify/ (Public passport verification)
     * - api/ (API proxy/routes if any)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|apple-icon|manifest|sw|v/|verify/).*)",
  ],
};
