import "server-only";
import { NextResponse } from "next/server";
import { config } from "../config";
import { SESSION_COOKIE } from "./current";
import type { FlowResult } from "./flows";

/** Respuesta JSON de un flujo de autenticación; si fue exitoso, define la cookie de sesión. */
export function flowResponse(r: FlowResult): NextResponse {
  if (!r.ok) return NextResponse.json({ error: r.error, fields: r.fields }, { status: 400 });
  const res = NextResponse.json({ ok: true, redirectTo: r.redirectTo });
  res.cookies.set(SESSION_COOKIE, r.token, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    path: "/",
    expires: r.expiresAt,
  });
  return res;
}
