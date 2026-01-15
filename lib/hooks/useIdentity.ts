"use client";

/**
 * Hook to determine if current user is 'admin' or 'friend' based on URL path
 */
export function useIdentity(): "admin" | "friend" {
  if (typeof window === "undefined") return "friend";
  return window.location.pathname.startsWith("/admin/") ? "admin" : "friend";
}
