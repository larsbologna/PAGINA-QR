import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/panel", "/admin", "/cuenta"];

/**
 * Primera barrera (barata): sin cookie de sesión no se entra a rutas privadas.
 * La validación real de la sesión y de los permisos se hace en el servidor
 * en cada página, acción y endpoint.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!req.cookies.get("ros_session")?.value) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/admin/:path*", "/cuenta/:path*"],
};
