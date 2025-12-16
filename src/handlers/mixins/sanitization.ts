/**
 * Mask the 'secret' field from a note document
 * Used when returning notes in list views or to non-owners
 *
 * @param note - Note document or plain object
 * @returns Note object without the secret field
 */
export function maskNoteSecret(note: any): any {
  const noteObj = note.toObject ? note.toObject() : note;
  const { secret, ...rest } = noteObj;
  return rest;
}

/**
 * Conditionally mask the 'secret' field based on ownership
 * Owners see the full note including secret, non-owners don't see the secret
 *
 * @param note - Note document or plain object
 * @param userId - Current user's ID
 * @returns Note object, with secret included only if user is the owner
 */
export function maskNoteSecretIfNotOwner(note: any, userId: string): any {
  const noteObj = note.toObject ? note.toObject() : note;

  // If user owns the note, return everything including secret
  if (noteObj.ownerId.toString() === userId) {
    return noteObj;
  }

  // Otherwise, mask the secret field
  const { secret, ...rest } = noteObj;
  return rest;
}

/**
 * Mask secrets from an array of notes
 * Used in list endpoints where we always hide secrets
 *
 * @param notes - Array of note documents
 * @returns Array of notes without secret fields
 */
export function maskNotesListSecrets(notes: any[]): any[] {
  return notes.map((note) => maskNoteSecret(note));
}
