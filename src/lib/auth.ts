import { auth as clerkAuth } from "@clerk/nextjs/server";

export function validateReturnTo(returnTo: string | null | undefined, origin: string) {
  if (!returnTo) return "/";
  try {
    const url = new URL(returnTo, origin);
    if (url.origin !== origin) return "/";
    // Only allow same-origin and relative paths
    return url.pathname + url.search;
  } catch (e) {
    return "/";
  }
}

export function requireAuth() {
  const { userId } = clerkAuth();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

export function requireRole(allowed: string | string[]) {
  const { sessionClaims } = clerkAuth();
  const role = (sessionClaims?.publicMetadata as any)?.role;
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (!role || !list.includes(role)) {
    throw new Error("FORBIDDEN");
  }
  return role;
}
