import { z } from "zod";

export const configSchema = z.object({
  azure: z.object({
    organization: z.string().min(1),
    project: z.string().min(1)
  }),
  repoRoots: z.array(z.string().min(1)).min(1),
  outputDir: z.string().min(1),
  git: z
    .object({
      authorEmail: z.string().email().optional()
    })
    .optional(),
  ignoreBranches: z.array(z.string().min(1)).default(["master", "develop"]),
  report: z.object({
    includeUnlinkedTechnicalWork: z.boolean().default(true)
  }),
  debug: z.object({
    enabledByDefault: z.boolean().default(false)
  })
});

export type Config = z.infer<typeof configSchema>;
