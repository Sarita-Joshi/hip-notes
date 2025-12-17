import { defineExpressHandler, htZodFactory } from "hipthrusts";
import { Note } from "../../models/mongoose/note";
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";
import { RequireOwnership } from "../mixins/ownership";
import { ParamsSchema, NoteResponseSchema} from '../../models/zod/note';

// Initialize Zod adapter
const { SanitizeParamsWithZod, SanitizeResponseWithZod, findByIdRequired } =
  htZodFactory();


export const GetNoteByIdHandlerUsingZod = defineExpressHandler({
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

  // Verify ownership (only owner can access the note)
  ...RequireOwnership("note"),

  // Return the note
  respond: (context: any) => {
    return {
      unsafeResponse: context.note,
      status: 200,
    };
  },

  // Validate response structure
  ...SanitizeResponseWithZod(NoteResponseSchema),
});
