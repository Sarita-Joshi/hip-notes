import { HTPipe, AttachData, htZodFactory } from 'hipthrusts';
import { Note } from '../../models/mongoose/note';
import { ParamsSchema } from '../../models/zod/note';

const { SanitizeParamsWithZod, findByIdRequired } = htZodFactory();

/**
 * Reusable sub-pipe for loading a note by ID from URL params.
 *
 * This demonstrates hipthrusts' composition pattern - you can create
 * reusable pipes and nest them inside other pipes.
 *
 * Usage:
 *   HTPipe(ExtractUserId, RequireAuthenticated, ParamIdToNote, RequireOwnership, ...)
 */
export const ParamIdToNote = HTPipe(
  SanitizeParamsWithZod(ParamsSchema),
  AttachData((ctx: any) => ({ noteId: ctx.params.id })),
  AttachData(async (ctx: any) => ({ note: await findByIdRequired(Note)(ctx.noteId) }))
);
