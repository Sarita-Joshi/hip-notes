import { Router, type IRouter } from "express";
import { hipExpressHandlerFactory } from "hipthrusts";

// Import Zod handlers
import { CreateNoteHandlerUsingZod } from "../handlers/usingZod/createNote";
import { GetNoteByIdHandlerUsingZod } from "../handlers/usingZod/getNoteById";
import { ListNotesHandlerUsingZod } from "../handlers/usingZod/listNotes";
import { UpdateNoteHandlerUsingZod } from "../handlers/usingZod/updateNote";
import { DeleteNoteHandlerUsingZod } from "../handlers/usingZod/deleteNote";

// Import Mongoose handlers
import { CreateNoteHandlerUsingMongoose } from "../handlers/usingMongoose/createNote";
import { GetNoteByIdHandlerUsingMongoose } from "../handlers/usingMongoose/getNoteById";
import { ListNotesHandlerUsingMongoose } from "../handlers/usingMongoose/listNotes";
import { UpdateNoteHandlerUsingMongoose } from "../handlers/usingMongoose/updateNote";
import { DeleteNoteHandlerUsingMongoose } from "../handlers/usingMongoose/deleteNote";

const router: IRouter = Router();

// Choose validation strategy based on environment variable
// Default to 'zod' if not specified
const VALIDATION_STRATEGY = process.env.VALIDATION_STRATEGY || "zod";

console.log(`[Routes] Using ${VALIDATION_STRATEGY.toUpperCase()} validation strategy`);

// Select handlers based on validation strategy
const handlers =
  VALIDATION_STRATEGY === "mongoose"
    ? {
        create: hipExpressHandlerFactory(CreateNoteHandlerUsingMongoose),
        getById: hipExpressHandlerFactory(GetNoteByIdHandlerUsingMongoose),
        list: hipExpressHandlerFactory(ListNotesHandlerUsingMongoose),
        update: hipExpressHandlerFactory(UpdateNoteHandlerUsingMongoose),
        delete: hipExpressHandlerFactory(DeleteNoteHandlerUsingMongoose),
      }
    : {
        create: hipExpressHandlerFactory(CreateNoteHandlerUsingZod),
        getById: hipExpressHandlerFactory(GetNoteByIdHandlerUsingZod),
        list: hipExpressHandlerFactory(ListNotesHandlerUsingZod),
        update: hipExpressHandlerFactory(UpdateNoteHandlerUsingZod),
        delete: hipExpressHandlerFactory(DeleteNoteHandlerUsingZod),
      };

// Define CRUD routes
router.post("/notes", handlers.create);
router.get("/notes/:id", handlers.getById);
router.get("/notes", handlers.list);
router.patch("/notes/:id", handlers.update);
router.delete("/notes/:id", handlers.delete);

export default router;
