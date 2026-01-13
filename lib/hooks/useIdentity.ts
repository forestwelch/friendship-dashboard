"use client";

/**
 * Hook to determine if current user is 'admin' or 'friend' based on URL path
 */
export function useIdentity(): "admin" | "friend" {
  if (typeof window === "undefined") return "friend";
  return window.location.pathname.startsWith("/admin/") ? "admin" : "friend";
}

/**
 * Utility function to determine identity from a pathname string
 */
export function getIdentityFromPath(pathname: string): "admin" | "friend" {
  return pathname.startsWith("/admin/") ? "admin" : "friend";
}
