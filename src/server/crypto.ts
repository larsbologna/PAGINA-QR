import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { config } from "./config";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Hash con secreto: permite agrupar por IP sin guardar la IP. */
export function keyedHash(value: string): string {
  return createHmac("sha256", config.appSecret).update(value).digest("hex");
}
