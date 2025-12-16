import mongoose from "mongoose";
import { defineExpressHandler, htZodFactory } from "hipthrusts";
import { z } from "zod";
import { Note } from '../../models/note';

// Initialize Zod adapter
const {
  SanitizeBodyWithZod,
  SanitizeResponseWithZod,
} = htZodFactory();

// Define Zod schemas for validation
const NoteRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  secret: z.string().optional(),
});

const NoteResponseSchema = z.object({
  _id: z.instanceof(mongoose.Types.ObjectId),
  title: z.string(),
  content: z.string(),
  ownerId: z.instanceof(mongoose.Types.ObjectId),
  secret: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CreateNoteHandlerUsingZod = defineExpressHandler({
  initPreContext: (context: any) => {
    const newcontext = { userId: context.req.userId as string };
    return newcontext;
  },
  sanitizeParams: async ({ params }: any): Promise<any> => params,
  ...SanitizeBodyWithZod(NoteRequestSchema),
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
  ...SanitizeResponseWithZod(NoteResponseSchema),
});


