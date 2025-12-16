import mongoose from "mongoose";
import { defineExpressHandler, htMongooseFactory } from "hipthrusts";
import { Note } from "../../models/mongoose/note";
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

// Response schema for delete operation (empty)
const DeleteResponseSchemaObj = {};

const ParamsDocFactory = documentFactoryFromForRequest(ParamsSchemaObj);
const DeleteResponseDocFactory = documentFactoryFromForResponse(
  DeleteResponseSchemaObj
);

export const DeleteNoteHandlerUsingMongoose = defineExpressHandler({
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
  ...SanitizeResponseWithMongoose(DeleteResponseDocFactory),
});
