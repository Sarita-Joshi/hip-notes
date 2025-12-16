import { FinalAuthorize } from "hipthrusts";

/**
 * Verify that the current user owns the note
 * This should be used in finalAuthorize after the note has been fetched in attachData
 *
 * @param notePropertyKey - The key in context where the note document is stored (default: 'note')
 * @returns A FinalAuthorize function that checks ownership
 */
export function RequireOwnership(notePropertyKey: string = "note") {
  return FinalAuthorize((context: any) => {
    const note = context[notePropertyKey];
    const userId = context.userId || context.preContext?.userId;

    if (!note || !note.ownerId) {
      return false; // Note doesn't exist or missing ownerId
    }

    if (note.ownerId.toString() !== userId) {
      return false; // User doesn't own this note → 403 Forbidden
    }

    return true;
  });
}
