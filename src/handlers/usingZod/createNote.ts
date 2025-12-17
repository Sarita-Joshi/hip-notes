import mongoose from "mongoose";
import { defineExpressHandler, htZodFactory, NoopFinalAuth } from "hipthrusts";
import { Note } from "../../models/mongoose/note";
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";
import { NoteRequestSchema, NoteResponseSchema} from '../../models/zod/note';

// Initialize Zod adapter
const { SanitizeBodyWithZod, SanitizeResponseWithZod } = htZodFactory();


export const CreateNoteHandlerUsingZod = defineExpressHandler({
  // Extract userId from request
  ...ExtractUserId,

  // Validate request body
  ...SanitizeBodyWithZod(NoteRequestSchema),

  // Check user is authenticated (all authenticated users can create notes)
  ...RequireAuthenticated,

  // All authenticated users can create notes - no ownership check needed
  ...NoopFinalAuth(),

  // Create and save the note
  doWork: async (context: any) => {
    // Create the note document with validated body
    const noteDocument = new Note(context.body);

    // Set the ownerId from the authenticated user
    const userId = context.userId || context.preContext?.userId;
    noteDocument.ownerId = new mongoose.Types.ObjectId(userId) as any;

    // Save to database
    const saved = await noteDocument.save();
    return { noteDocument: saved };
  },

  // Return created note with 201 status
  respond: (context: any) => {
    return {
      unsafeResponse: context.noteDocument,
      status: 201,
    };
  },

  // Validate response structure
  ...SanitizeResponseWithZod(NoteResponseSchema),
});


