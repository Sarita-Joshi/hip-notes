import { InitPreContext, PreAuthorize } from "hipthrusts";

/**
 * Extract userId from the mock authentication middleware
 * This creates a preContext with the authenticated user's ID
 */
export const ExtractUserId = InitPreContext((context: any) => ({
  userId: context.req.userId as string,
}));

/**
 * Verify that the user is authenticated
 * Returns false if no userId is found, triggering a 403 Forbidden response
 */
export const RequireAuthenticated = PreAuthorize((context: any) => {
  const userId = context.userId || context.preContext?.userId;

  if (!userId) {
    return false; // Triggers 403 Forbidden via Boom
  }

  return true;
});
