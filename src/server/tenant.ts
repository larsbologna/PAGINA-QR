import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export type Tx = Prisma.TransactionClient;

const TX_OPTIONS = { maxWait: 5000, timeout: 15000 } as const;

/**
 * Ejecuta `fn` dentro de una transacción en la que PostgreSQL solo deja ver y
 * escribir filas del negocio indicado (Row Level Security). Es una segunda
 * barrera: el código además filtra siempre por businessId.
 */
export function withTenant<T>(businessId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!businessId) throw new Error("withTenant requiere businessId");
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.business_id', ${businessId}, true)`;
    return fn(tx);
  }, TX_OPTIONS);
}

/**
 * Acceso de sistema (superadministrador, tareas programadas). Úsese solo en
 * código que ya verificó que el usuario es superadministrador o en scripts.
 */
export function withSystem<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.rls_bypass', 'on', true)`;
    return fn(tx);
  }, TX_OPTIONS);
}
