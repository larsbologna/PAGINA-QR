import "server-only";
import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let dummyHash: string | null = null;

/** Compara contra un hash ficticio para igualar tiempos cuando el usuario no existe. */
export async function verifyDummy(password: string): Promise<void> {
  dummyHash ??= await bcrypt.hash("contraseña-ficticia", COST);
  await bcrypt.compare(password, dummyHash);
}
