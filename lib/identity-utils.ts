/**
 * Identity detection utilities
 * Determines if current user is 'admin' or 'friend' based on URL path
 */

export function getIdentityFromPath(pathname: string): "admin" | "friend" {
  return pathname.startsWith("/admin/") ? "admin" : "friend";
}

export function useIdentity(): "admin" | "friend" {
  if (typeof window === "undefined") return "friend";
  return getIdentityFromPath(window.location.pathname);
}
