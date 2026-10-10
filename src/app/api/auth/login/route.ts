import { NextResponse, type NextRequest } from "next/server";
import { loginFlow } from "@/server/auth/flows";
import { flowResponse } from "@/server/auth/route-cookies";
import { clientIpFrom, isSameOrigin } from "@/server/request";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers)) return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return flowResponse(await loginFlow(body, clientIpFrom(req.headers)));
}
