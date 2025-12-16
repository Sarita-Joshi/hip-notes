import mongoose from "mongoose";
import { defineExpressHandler, htMongooseFactory } from "hipthrusts";
import { NoteSchemaObj, Note } from "../../models/mongoose/note";
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";
import { RequireOwnership } from "../mixins/ownership";

// Initialize Mongoose adapter
const {
  SanitizeParamsWithMongoose,
  SanitizeResponseWithMongoose,
  documentFactoryFromForRequest,
  documentFactoryFromForResponse,
  findByIdRequired,
} = htMongooseFactory(mongoose);

// Params schema for ObjectId validation
const ParamsSchemaObj = {
  id: { type: String, required: true, match: /^[0-9a-fA-F]{24}$/ },
};

const ParamsDocFactory = documentFactoryFromForRequest(ParamsSchemaObj);
const NoteResponseDocFactory = documentFactoryFromForResponse(NoteSchemaObj);

export const GetNoteByIdHandlerUsingMongoose = defineExpressHandler({
  // Extract userId from request
  ...ExtractUserId,

  // Validate route params (ObjectId format)
  ...SanitizeParamsWithMongoose(ParamsDocFactory),

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

  // No additional work needed, just return the note
  doWork: async (context: any) => {
    return {};
  },

  // Return the note
  respond: (context: any) => {
    return {
      unsafeResponse: context.note,
      status: 200,
    };
  },

  // Validate response structure
  ...SanitizeResponseWithMongoose(NoteResponseDocFactory),
});
