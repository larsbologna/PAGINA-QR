import "server-only";
import { getCurrentUser } from "./current";
import { resolveBusinessAccess } from "./access";

/** Para route handlers: devuelve null (⇒ 404) en vez de redirigir. */
export async function routeBusinessAccess(slug: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  const access = await resolveBusinessAccess(user, slug);
  return access ? { user, access } : null;
}
