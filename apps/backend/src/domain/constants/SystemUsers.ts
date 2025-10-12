/**
 * System Users Constants
 * 
 * Centralized constants for system-generated user IDs to avoid magic strings
 * throughout the codebase and improve maintainability.
 */

export const SystemUsers = {
  /** Public equipment system user for shared equipment catalog */
  PUBLIC_EQUIPMENT: 'public-equipment-system',
  
  /** Admin system user for administrative operations */
  ADMIN_SYSTEM: 'admin-system',
  
  /** System bot user for automated operations */
  SYSTEM_BOT: 'system-bot'
} as const;

/**
 * Type definition for system user IDs
 */
export type SystemUserId = typeof SystemUsers[keyof typeof SystemUsers];

/**
 * Helper function to check if a user ID is a system user
 */
export function isSystemUser(userId: string): userId is SystemUserId {
  return Object.values(SystemUsers).includes(userId as SystemUserId);
}