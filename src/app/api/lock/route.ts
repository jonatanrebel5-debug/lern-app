import { cookies } from "next/headers";
import { ACCESS_COOKIE } from "@/lib/auth";

/** POST /api/lock – entfernt die Freischaltung auf diesem Gerät (z. B. Ausbilder-Gerät abmelden). */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  return Response.json({ ok: true });
}
