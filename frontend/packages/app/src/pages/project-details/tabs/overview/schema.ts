import { z } from "zod";

export const overviewSchema = z.object({
  summary: z.string(),
  keyGoals: z.string(),
  priority: z.string(),
  complexity: z.string(),
  keyAccount: z.string(),
  source: z.string(),
  primaryLocation: z.string(),
  previousCms: z.string(),
  pointOfContact: z.string(),
  frequency: z.string(),
  ndaSigned: z.string(),
  caseStudyApproved: z.string(),
  testimonialApproval: z.string(),
  testimonialContact: z.string(),
});

export type OverviewFormValues = z.infer<typeof overviewSchema>;
