import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { config } from "../config";
import { validateSessionToken, type SessionUser } from "./sessions";
import { resolveBusinessAccess, type BusinessAccess } from "./access";

export const SESSION_COOKIE = "ros_session";

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Usuario de la sesión actual (memoizado por request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  return validateSessionToken(await readSessionToken());
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireSuperadmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "SUPERADMIN") notFound();
  return user;
}

export const getBusinessAccess = cache(async (slug: string): Promise<{ user: SessionUser; access: BusinessAccess }> => {
  const user = await requireUser();
  const access = await resolveBusinessAccess(user, slug);
  if (!access) notFound();
  return { user, access };
});

export async function requireManageAccess(slug: string) {
  const r = await getBusinessAccess(slug);
  if (!r.access.canManage) notFound();
  return r;
}
