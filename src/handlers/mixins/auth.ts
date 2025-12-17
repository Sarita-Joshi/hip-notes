import { InitPreContext, PreAuthorize } from "hipthrusts";

/**
 * HIPTHRUSTS AUTHORIZATION PATTERN
 * ================================
 *
 * Hipthrusts separates authorization into two stages:
 *
 *   1. PreAuthorize  → Runs BEFORE data is fetched
 *                      Use for: role checks, authentication verification
 *                      Example: "Is user logged in?", "Is user an admin?"
 *
 *   2. AttachData    → Load data from database
 *                      Use for: fetching resources needed for ownership checks
 *                      Example: Load the note document by ID
 *
 *   3. FinalAuthorize → Runs AFTER data is fetched
 *                       Use for: ownership checks, resource-level permissions
 *                       Example: "Does this user own this note?"
 *
 * WHY THIS SEPARATION?
 * - Prevents unauthorized users from triggering expensive DB queries
 * - PreAuth fails fast before any data loading
 * - FinalAuth has access to the loaded resource for ownership verification
 *
 * FLOW EXAMPLE:
 *   Request → PreAuth(is logged in?) → AttachData(load note) → FinalAuth(owns note?) → DoWork
 */

/**
 * Extract userId from the X-User-Id header.
 * This creates a preContext with the authenticated user's ID.
 *
 * Uses: InitPreContext - the first stage in the hipthrusts lifecycle
 */
export const ExtractUserId = InitPreContext((context: any) => ({
  userId: context.req.get('X-User-Id') as string,
}));

/**
 * Verify that the user is authenticated.
 * Returns false if no userId is found, triggering a 403 Forbidden response.
 *
 * Uses: PreAuthorize - runs BEFORE data fetching to fail fast
 */
export const RequireAuthenticated = PreAuthorize((context: any) => {
  const userId = context.userId || context.preContext?.userId;

  if (!userId) {
    return false; // Triggers 403 Forbidden via Boom
  }

  return true;
});
