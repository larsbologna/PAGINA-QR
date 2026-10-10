import "server-only";
import { headers } from "next/headers";
import { config } from "./config";

/** IP del cliente. Solo confía en X-Forwarded-For si TRUST_PROXY=true. */
export function clientIpFrom(h: Headers): string {
  if (config.trustProxy) {
    const xff = h.get("x-forwarded-for");
    if (xff) return xff.split(",")[0]!.trim();
    const real = h.get("x-real-ip");
    if (real) return real.trim();
  }
  return h.get("x-real-ip")?.trim() || "local";
}

export async function clientIp(): Promise<string> {
  return clientIpFrom(await headers());
}

/** Protección CSRF para endpoints POST: el Origin (si viene) debe coincidir con el Host. */
export function isSameOrigin(h: Headers): boolean {
  const origin = h.get("origin");
  if (!origin) return h.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === h.get("host");
  } catch {
    return false;
  }
}
