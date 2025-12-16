import mongoose from "mongoose";
import { defineExpressHandler, htMongooseFactory } from "hipthrusts";
import { NoteSchemaObj, Note } from '../../models/note';

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
  initPreContext: (context: any) => {
    const newcontext = { userId: context.req.userId as string };
    return newcontext;
  },
  sanitizeParams: async ({ params }: any): Promise<any> => params,
  ...SanitizeBodyWithMongoose(NoteRequestDocFactory),
  preAuthorize: (context: any): Record<string, string> => ({ ...context }),
  // attachData: In a real app, you might fetch user info here for authorization
  // For example: fetch user from DB to check permissions, quotas, etc.
  attachData: async (context: any) => {
    // For this simple case, we don't need to attach additional data
    // In a real app, you might do:
    // const user = await User.findById(context.userId);
    // return { user };
    return {};
  },
  finalAuthorize: (context: any): any => ({ ...context }),
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
  respond: (context: any): any => {
    return {
      unsafeResponse: context.noteDocument,
      status: 201,
    };
  },
  ...SanitizeResponseWithMongoose(NoteResponseDocFactory),
});


