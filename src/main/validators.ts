import { z } from 'zod';
import { QUEST_KEY_SLUG_REGEX, MIN_QUESTS, MAX_QUESTS } from '@shared/constants';

export const QuestExportSchema = z.object({
  questKey: z.string().regex(QUEST_KEY_SLUG_REGEX),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  rotation: z.number(),
  lockedImg: z.string(),
  doneImg: z.string(),
});

export const QuestlineExportSchema = z.object({
  questlineId: z.string().regex(QUEST_KEY_SLUG_REGEX),
  frameSize: z.object({ width: z.number(), height: z.number() }),
  background: z.object({ exportUrl: z.string() }),
  quests: z.array(QuestExportSchema)
    .min(MIN_QUESTS, { message: `At least ${MIN_QUESTS} quests required.` })
    .max(MAX_QUESTS, { message: `No more than ${MAX_QUESTS} quests allowed.` })
    .refine(
      (quests: Array<z.infer<typeof QuestExportSchema>>) => {
        const keys = quests.map((q) => q.questKey.trim().toLowerCase());
        return new Set(keys).size === keys.length;
      },
      { message: 'Quest keys must be unique (case-insensitive, trimmed).' }
    )
    .refine(
      (quests: Array<z.infer<typeof QuestExportSchema>>) => quests.every((q) => !/\s{2,}/.test(q.questKey)),
      { message: 'Quest keys cannot have double whitespace.' }
    ),
});

export type QuestExport = z.infer<typeof QuestExportSchema>;
export type QuestlineExport = z.infer<typeof QuestlineExportSchema>;
