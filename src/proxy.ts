import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, getAuthConfig, roleFromToken, trainerMayAccess } from "@/lib/auth";

/**
 * Zugriffsschutz: Läuft auf dem Server vor jeder Seite und jeder API.
 *  - ohne gültiges Cookie       → /unlock (API: 401)
 *  - Ausbilder-Rolle            → nur /ausbilder + Lesen des Lernstands (sonst → /ausbilder, API: 403)
 *  - Lern-Rolle                 → alles
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const role = roleFromToken(request.cookies.get(ACCESS_COOKIE)?.value, getAuthConfig());
  const isApi = pathname.startsWith("/api/");

  if (role === "learner") return NextResponse.next();

  if (role === "trainer") {
    if (trainerMayAccess(pathname, request.method)) return NextResponse.next();
    if (isApi) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/ausbilder", request.url));
  }

  if (isApi) return NextResponse.json({ error: "locked" }, { status: 401 });

  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = "";
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Alles schützen außer:
     *  - der Freischalt-Seite und ihrer API
     *  - Next.js-Dateien (JS/CSS), Icons, Manifest, Service Worker, Favicon
     *    (enthalten keine Lerndaten; iOS lädt Icon & Manifest teils ohne Cookies)
     */
    "/((?!unlock|api/unlock|_next/static|_next/image|icons/|manifest.webmanifest|sw.js|favicon.ico).*)",
  ],
};
