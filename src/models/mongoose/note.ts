import mongoose from "mongoose";

export const NoteSchemaObj = {
  title: { type: String, required: true },
  content: { type: String, required: true },
  ownerId: { type: mongoose.Types.ObjectId, required: true },
  secret: { type: String },
};


export const NoteSchema = new mongoose.Schema(NoteSchemaObj, { timestamps: true });

export const Note = mongoose.model("Note", NoteSchema);
