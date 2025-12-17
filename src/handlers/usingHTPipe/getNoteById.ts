import {
  HTPipe,
  composePipes,
  hipExpressHandlerFactory,
  htZodFactory,
  AttachData,
  Respond,
} from "hipthrusts";
import type { RequestHandler } from "express";
import { Note } from "../../models/mongoose/note";
import { NoteResponseSchema, ParamsSchema } from "../../models/zod/note";
import { ExtractUserId, RequireAuthenticated } from "../mixins/auth";
import { RequireOwnership } from "../mixins/ownership";

const { SanitizeParamsWithZod, SanitizeResponseWithZod, findByIdRequired } = htZodFactory();

/**
 * GET /notes/:id - Fetch a note by ID (using HTPipe composition)
 *
 * This handler demonstrates the HTPipe composition pattern - hipthrusts'
 * signature feature for building request handlers from reusable pieces.
 *
 * HTPipe COMPOSITION:
 *   HTPipe merges multiple "stage objects" into a single handler.
 *   Each stage object provides one or more lifecycle hooks.
 *
 * NOTE: HTPipe's TypeScript overloads support up to 4 arguments.
 *   For more stages, nest HTPipe calls: HTPipe(HTPipe(a, b), HTPipe(c, d))
 *
 * PIPELINE STRUCTURE:
 *   Pipe1: ExtractUserId + SanitizeParams + RequireAuthenticated
 *   Pipe2: AttachData (load note)
 *   Pipe3: RequireOwnership + Respond + SanitizeResponse
 *   Final: HTPipe(Pipe1, Pipe2, Pipe3)
 */

// Sub-pipe 1: Initialize context, validate params, check authentication
const InitAndAuthPipe = HTPipe(
  ExtractUserId,
  SanitizeParamsWithZod(ParamsSchema),
  RequireAuthenticated
);

// Sub-pipe 2: Load the note from database
const LoadNotePipe = AttachData(async (context: any) => {
  const noteId = context.params.id;
  const note = await findByIdRequired(Note)(noteId);
  return { note };
});

// Sub-pipe 3: Check ownership, format response, sanitize output
const AuthorizeAndRespondPipe = HTPipe(
  RequireOwnership("note"),
  Respond((ctx: any) => ctx.note, 200),
  SanitizeResponseWithZod(NoteResponseSchema)
);

// Final composition: Use composePipes to combine all sub-pipes
// composePipes bypasses HTPipe's TypeScript overload limitations for deeply nested compositions
export const GetNoteByIdHandlerUsingHTPipe: RequestHandler = hipExpressHandlerFactory(
  composePipes(InitAndAuthPipe, LoadNotePipe, AuthorizeAndRespondPipe)
);
