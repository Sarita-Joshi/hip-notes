import mongoose from "mongoose";
import { defineExpressHandler, htZodFactory, NoopFinalAuth } from "hipthrusts";
import { z } from "zod";
import { Note } from "../../models/mongoose/note";
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";
import {
  PaginationQuerySchema,
  buildPaginationResponse,
} from "../mixins/pagination";
import { maskNotesListSecrets } from "../mixins/sanitization";
import { NoteRequestSchema, NoteResponseSchema} from '../../models/zod/note';


// Initialize Zod adapter
const { SanitizeQueryParamsWithZod, SanitizeResponseWithZod } = htZodFactory();

// Response schema for the paginated list
const ListNotesResponseSchema = z.object({
  data: z.array(NoteResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const ListNotesHandlerUsingZod = defineExpressHandler({
  // Extract userId from request
  ...ExtractUserId,

  // Validate query params (pagination, search, sort)
  ...SanitizeQueryParamsWithZod(PaginationQuerySchema),

  // Check user is authenticated
  ...RequireAuthenticated,

  // No ownership check - filtering happens in doWork (user sees only their notes)
  ...NoopFinalAuth(),

  // Fetch notes with pagination, search, and sorting
  doWork: async (context: any) => {
    const { page, limit, search, sort } = context.queryParams;
    const userId = context.userId || context.preContext?.userId;

    // Build filter - user can only see their own notes
    const filter: any = { ownerId: new mongoose.Types.ObjectId(userId) };

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // Parse sort field and order
    const sortField = sort.startsWith("-") ? sort.substring(1) : sort;
    const sortOrder = sort.startsWith("-") ? -1 : 1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [notes, total] = await Promise.all([
      Note.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      Note.countDocuments(filter),
    ]);

    return { notes, total, page, limit };
  },

  // Build paginated response
  respond: (context: any) => {
    const { notes, total, page, limit } = context;

    // Mask secrets from all notes in list view
    const maskedNotes = maskNotesListSecrets(notes);

    // Build pagination response
    const response = buildPaginationResponse(maskedNotes, total, page, limit);

    return {
      unsafeResponse: response,
      status: 200,
    };
  },

  // Validate response structure
  ...SanitizeResponseWithZod(ListNotesResponseSchema),
});
