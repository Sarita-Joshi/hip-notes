// import mongoose from "mongoose";

// const NoteSchema = new mongoose.Schema({
//     title: { type: String, required: true },
//     content: { type: String, required: true },
//     ownerId: { type: mongoose.Types.ObjectId, required: true},
//     secret: { type: String }
// });

// export const NoteModel = mongoose.model("Note", NoteSchema);

// export const NoteSchemaObj = {
//     ownerId: mongoose.Types.ObjectId,
//     title: String,
//     content: String,
//     secret: String,
//     _id: mongoose.Types.ObjectId
// }

import mongoose from "mongoose";

// Schema configuration object for hipthrusts mongoose adapter
export const NoteSchemaObj = {
  title: { type: String, required: true },
  content: { type: String, required: true },
  ownerId: { type: mongoose.Types.ObjectId, required: true },
  secret: { type: String },
};

// Note Model (you can put this in a separate file)
export const NoteSchema = new mongoose.Schema(NoteSchemaObj, { timestamps: true });

export const Note = mongoose.model("Note", NoteSchema);
