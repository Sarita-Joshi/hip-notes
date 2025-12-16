import mongoose from "mongoose";
import { defineExpressHandler, htMongooseFactory } from "hipthrusts";
import { NoteSchemaObj, Note } from "../../models/mongoose/note";
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";
import { RequireOwnership } from "../mixins/ownership";

// Initialize Mongoose adapter
const {
  SanitizeParamsWithMongoose,
  SanitizeBodyWithMongoose,
  SanitizeResponseWithMongoose,
  documentFactoryFromForRequest,
  documentFactoryFromForResponse,
  findByIdRequired,
} = htMongooseFactory(mongoose);

// Params schema for ObjectId validation
const ParamsSchemaObj = {
  id: { type: String, required: true, match: /^[0-9a-fA-F]{24}$/ },
};

// Body schema - all fields optional for partial update
const UpdateNoteSchemaObj = {
  title: { type: String, minlength: 1 },
  content: { type: String, minlength: 1 },
  secret: { type: String },
};

const ParamsDocFactory = documentFactoryFromForRequest(ParamsSchemaObj);
const UpdateBodyDocFactory = documentFactoryFromForRequest(UpdateNoteSchemaObj);
const NoteResponseDocFactory = documentFactoryFromForResponse(NoteSchemaObj);

export const UpdateNoteHandlerUsingMongoose = defineExpressHandler({
  // Extract userId from request
  ...ExtractUserId,

  // Validate route params (ObjectId format)
  ...SanitizeParamsWithMongoose(ParamsDocFactory),

  // Validate body (partial update - validateModifiedOnly)
  ...SanitizeBodyWithMongoose(UpdateBodyDocFactory),

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

    // Check that at least one field is being updated
    if (Object.keys(body).length === 0) {
      const Boom = require("@hapi/boom");
      throw Boom.badRequest("At least one field must be provided for update");
    }

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
  ...SanitizeResponseWithMongoose(NoteResponseDocFactory),
});
