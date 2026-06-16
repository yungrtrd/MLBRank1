import { z } from "zod";

export const compareRequestSchema = z.object({
  playerIds: z.array(z.string()).min(1).max(6),
  mode: z.enum(["season", "career"]),
  metrics: z.array(z.string()).optional(),
  startYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
  role: z.enum(["hitter", "pitcher"]).optional(),
  situation: z
    .object({
      inningMin: z.number().int().min(1).max(9).optional(),
      inningMax: z.number().int().min(1).max(9).optional(),
      maxRunMargin: z.number().int().min(1).max(10).optional()
    })
    .optional()
});
