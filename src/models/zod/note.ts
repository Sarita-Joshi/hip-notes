import mongoose from "mongoose";
import { z } from "zod";


export const NoteRequestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  secret: z.string().optional(),
});

export const NoteResponseSchema = z.object({
  _id: z.instanceof(mongoose.Types.ObjectId),
  title: z.string(),
  content: z.string(),
  ownerId: z.instanceof(mongoose.Types.ObjectId),
  secret: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});


export const ParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
});


export const UpdateNoteRequestSchema = z
  .object({
    title: z.string().min(1, "Title cannot be empty"),
    content: z.string().min(1, "Content cannot be empty"),
    secret: z.string(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });