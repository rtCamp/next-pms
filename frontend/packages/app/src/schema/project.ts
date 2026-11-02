/**
 * External dependencies.
 */
import { z } from "zod";

export const ProjectSchema = z.object({
  naming_series: z
    .string({
      error: "Please select a naming series.",
    })
    .trim()
    .min(1, { message: "Please select a naming series." }),
  project_name: z
    .string({
      error: "Please add a project name.",
    })
    .trim()
    .min(1, { message: "Please add a project name." }),
  project_template: z.string().optional(),
  company: z
    .string({
      error: "Please select a company.",
    })
    .trim()
    .min(1, { message: "Please select a company." }),
});
