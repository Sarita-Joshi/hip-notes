import mongoose from "mongoose";
import { defineExpressHandler, htMongooseFactory } from "hipthrusts";
import { Note } from "../../models/mongoose/note";
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";
import {
  PaginationQuerySchema,
  buildPaginationResponse,
} from "../mixins/pagination";
import { maskNotesListSecrets } from "../mixins/sanitization";

// Initialize Mongoose adapter
const {
  SanitizeQueryParamsWithMongoose,
  SanitizeResponseWithMongoose,
  documentFactoryFromForRequest,
  documentFactoryFromForResponse,
} = htMongooseFactory(mongoose);

// Convert Zod schema to Mongoose schema object for query params
const QueryParamsSchemaObj = {
  page: { type: Number, default: 1, min: 1 },
  limit: { type: Number, default: 10, min: 1, max: 100 },
  search: { type: String },
  sort: {
    type: String,
    enum: ["createdAt", "-createdAt", "title", "-title", "updatedAt", "-updatedAt"],
    default: "-createdAt",
  },
};

// Response schema - note without secret field
const NoteListItemSchemaObj = {
  _id: { type: mongoose.Types.ObjectId },
  title: { type: String },
  content: { type: String },
  ownerId: { type: mongoose.Types.ObjectId },
  createdAt: { type: Date },
  updatedAt: { type: Date },
};

// Paginated response schema
const ListResponseSchemaObj = {
  data: { type: Array },
  pagination: {
    type: Object,
    schema: {
      page: { type: Number },
      limit: { type: Number },
      total: { type: Number },
      totalPages: { type: Number },
    },
  },
};

const QueryParamsDocFactory = documentFactoryFromForRequest(QueryParamsSchemaObj);
const ListResponseDocFactory = documentFactoryFromForResponse(ListResponseSchemaObj);

export const ListNotesHandlerUsingMongoose = defineExpressHandler({
  // Extract userId from request
  ...ExtractUserId,

  // Validate query params (pagination, search, sort)
  ...SanitizeQueryParamsWithMongoose(QueryParamsDocFactory),

  // Check user is authenticated
  ...RequireAuthenticated,

  // No additional data to attach
  attachData: async (context: any) => {
    return {};
  },

  // Users can only see their own notes
  finalAuthorize: (context: any) => {
    return true;
  },

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
  ...SanitizeResponseWithMongoose(ListResponseDocFactory),
});
