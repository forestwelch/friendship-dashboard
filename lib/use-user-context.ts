"use client";

import { usePathname } from "next/navigation";

export type UserType = "admin" | "friend";

export interface UserContext {
  isAdmin: boolean;
  userType: UserType;
  userId: string | null; // For admin: "admin", for friend: will be set per page
}

/**
 * Hook to determine if current user is admin or friend based on URL path
 * - `/admin/[friend]` → admin
 * - `/[friend]` → friend
 */
export function useUserContext(): UserContext {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin/") ?? false;
  const userType: UserType = isAdmin ? "admin" : "friend";
  const userId = isAdmin ? "admin" : null; // Will be set per friend page using friendId

  return {
    isAdmin,
    userType,
    userId,
  };
}

/**
 * Get the user ID for a specific friend page
 * - Admin always returns "admin"
 * - Friend returns the friend's ID
 */
export function getUserIdForFriend(
  userContext: UserContext,
  friendId: string
): string {
  if (userContext.isAdmin) {
    return "admin";
  }
  return friendId;
}

