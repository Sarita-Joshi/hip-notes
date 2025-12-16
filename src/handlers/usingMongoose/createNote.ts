import mongoose from "mongoose";
import { defineExpressHandler, htMongooseFactory } from "hipthrusts";
import { NoteSchemaObj, Note } from "../../models/mongoose/note";
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";

// Initialize mongoose adapter
const {
  SanitizeBodyWithMongoose,
  SanitizeResponseWithMongoose,
  documentFactoryFromForRequest,
  documentFactoryFromForResponse,
} = htMongooseFactory(mongoose);

// Create document factories for request and response validation
const NoteRequestDocFactory = documentFactoryFromForRequest(NoteSchemaObj);
const NoteResponseDocFactory = documentFactoryFromForResponse(NoteSchemaObj);

export const CreateNoteHandlerUsingMongoose = defineExpressHandler({
  // Extract userId from request
  ...ExtractUserId,

  // Validate request body
  ...SanitizeBodyWithMongoose(NoteRequestDocFactory),

  // Check user is authenticated (all authenticated users can create notes)
  ...RequireAuthenticated,

  // No additional data to attach
  attachData: async (context: any) => {
    return {};
  },

  // All authenticated users can create notes
  finalAuthorize: (context: any) => {
    return true;
  },

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
  ...SanitizeResponseWithMongoose(NoteResponseDocFactory),
});


