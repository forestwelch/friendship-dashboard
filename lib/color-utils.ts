import { ADMIN_USER_ID } from "./constants";

/**
 * Color assignment utilities
 * Friend (Max) = Always Primary (Pink)
 * Admin (Forest) = Always Secondary (Green)
 * Regardless of who is viewing
 */

/**
 * Get the color for a user ID
 * @param userId - The user ID ("admin" or friend ID)
 * @param friendId - The friend's ID (to determine if userId is the friend)
 * @param themeColors - Theme colors object
 * @returns The color string (primary for friend, secondary for admin)
 */
export function getUserColor(
  userId: string,
  friendId: string,
  themeColors: { primary: string; secondary: string }
): string {
  // Admin is always secondary (green)
  if (userId === ADMIN_USER_ID) {
    return themeColors.secondary;
  }
  // Friend is always primary (pink)
  return themeColors.primary;
}

/**
 * Check if a user ID is the friend (not admin)
 * @param userId - The user ID to check
 * @returns true if the user is the friend, false if admin
 */
export function isFriendUser(userId: string): boolean {
  return userId !== ADMIN_USER_ID;
}

/**
 * Get CSS variable for user color
 * @param userId - The user ID ("admin" or friend ID)
 * @param friendId - The friend's ID (to determine if userId is the friend)
 * @returns CSS variable string ("var(--primary)" for friend, "var(--secondary)" for admin)
 */
export function getUserColorVar(userId: string, _friendId: string): string {
  // Admin is always secondary (green)
  if (userId === ADMIN_USER_ID) {
    return "var(--secondary)";
  }
  // Friend is always primary (pink)
  return "var(--primary)";
}
