import { NextResponse, type NextRequest } from "next/server";
import { logoutFlow } from "@/server/auth/flows";
import { SESSION_COOKIE } from "@/server/auth/current";
import { isSameOrigin } from "@/server/request";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  await logoutFlow(req.cookies.get(SESSION_COOKIE)?.value);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
