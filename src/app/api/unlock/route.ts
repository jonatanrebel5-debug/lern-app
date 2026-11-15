import { cookies } from "next/headers";
import { ACCESS_COOKIE, ACCESS_COOKIE_MAX_AGE, createAccessToken, getAuthConfig, roleForCode, safeNextPath } from "@/lib/auth";

/** Kleine Bremse gegen Durchprobieren: Jede falsche Eingabe dauert ~1 Sekunde. */
const WRONG_CODE_DELAY_MS = 1000;

/**
 * POST /api/unlock  { code, next }
 * Lern-Code → komplette App, Ausbilder-Code → /ausbilder. Setzt das Freischalt-Cookie.
 */
export async function POST(request: Request) {
  const config = getAuthConfig();
  if (!config) {
    return Response.json({ ok: false, error: "not-configured" }, { status: 503 });
  }

  let body: { code?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "bad-request" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.slice(0, 200) : "";
  const role = roleForCode(code, config);
  if (!role) {
    await new Promise((resolve) => setTimeout(resolve, WRONG_CODE_DELAY_MS));
    return Response.json({ ok: false, error: "wrong-code" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, createAccessToken(role, config), {
    httpOnly: true, // für JavaScript unsichtbar
    secure: process.env.NODE_ENV === "production", // online nur über HTTPS
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE,
  });

  return Response.json({ ok: true, role, next: safeNextPath(body.next, role) });
}
