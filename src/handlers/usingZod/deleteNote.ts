import mongoose from "mongoose";
import { defineExpressHandler, htZodFactory } from "hipthrusts";
import { z } from "zod";
import { Note } from "../../models/mongoose/note";
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";
import { RequireOwnership } from "../mixins/ownership";

// Initialize Zod adapter
const { SanitizeParamsWithZod, SanitizeResponseWithZod, findByIdRequired } =
  htZodFactory();

// ObjectId validation schema for params
const ParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
});

// Response schema for delete operation (empty)
const DeleteResponseSchema = z.object({});

export const DeleteNoteHandlerUsingZod = defineExpressHandler({
  // Extract userId from request
  ...ExtractUserId,

  // Validate route params (ObjectId format)
  ...SanitizeParamsWithZod(ParamsSchema),

  // Check user is authenticated
  ...RequireAuthenticated,

  // Fetch the note by ID (throws 404 if not found)
  attachData: async (context: any) => {
    const noteId = context.params.id;
    const note = await findByIdRequired(Note)(noteId);
    return { note };
  },

  // Verify ownership (only owner can delete the note)
  ...RequireOwnership("note"),

  // Delete the note
  doWork: async (context: any) => {
    const { note } = context;
    await note.deleteOne();
    return {};
  },

  // Return 204 No Content
  respond: (context: any) => {
    return {
      unsafeResponse: {},
      status: 204,
    };
  },

  // Validate response structure (empty object for 204)
  ...SanitizeResponseWithZod(DeleteResponseSchema),
});
