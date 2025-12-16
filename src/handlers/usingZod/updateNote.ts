import mongoose from "mongoose";
import { defineExpressHandler, htZodFactory } from "hipthrusts";
import { z } from "zod";
import { Note } from "../../models/mongoose/note";
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";
import { RequireOwnership } from "../mixins/ownership";
import { ParamsSchema, UpdateNoteRequestSchema, NoteResponseSchema} from '../../models/zod/note';

// Initialize Zod adapter
const {
  SanitizeParamsWithZod,
  SanitizeBodyWithZod,
  SanitizeResponseWithZod,
  findByIdRequired,
} = htZodFactory();





export const UpdateNoteHandlerUsingZod = defineExpressHandler({
  // Extract userId from request
  ...ExtractUserId,

  // Validate route params (ObjectId format)
  ...SanitizeParamsWithZod(ParamsSchema),

  // Validate body (partial update - all fields optional)
  ...SanitizeBodyWithZod(UpdateNoteRequestSchema),

  // Check user is authenticated
  ...RequireAuthenticated,

  // Fetch the note by ID (throws 404 if not found)
  attachData: async (context: any) => {
    const noteId = context.params.id;
    const note = await findByIdRequired(Note)(noteId);
    return { note };
  },

  // Verify ownership (only owner can update the note)
  ...RequireOwnership("note"),

  // Apply updates and save
  doWork: async (context: any) => {
    const { note, body } = context;

    // Apply updates to the note
    Object.assign(note, body);

    // Save the updated note
    const updatedNote = await note.save();

    return { updatedNote };
  },

  // Return the updated note
  respond: (context: any) => {
    return {
      unsafeResponse: context.updatedNote,
      status: 200,
    };
  },

  // Validate response structure
  ...SanitizeResponseWithZod(NoteResponseSchema),
});
