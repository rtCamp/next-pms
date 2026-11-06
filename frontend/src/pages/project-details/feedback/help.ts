import type { FieldHelp } from "@/components/InfoHoverCard";
import { scoreClass } from "./feedback";

export const FEEDBACK_HELP = {
  client: {
    title: "Client feedback",
    summary:
      "The client's overall score for each month, out of 100, shown in the month strip.",
    formula: "Average stars across the four rating questions ÷ 4 × 100",
    legend: [
      {
        label: "Score 80 and above",
        sample: "94",
        class: `font-medium ${scoreClass(94, false)}`,
      },
      {
        label: "Score 60–79",
        sample: "72",
        class: `font-medium ${scoreClass(72, false)}`,
      },
      {
        label: "Score under 60",
        sample: "45",
        class: `font-medium ${scoreClass(45, false)}`,
      },
    ],
    details: [
      "Each question is rated out of 4 stars. The percentage beside each rating in the breakdown uses the same scale, so 3 stars is 75%.",
    ],
    wiki: "Feedback#client-feedback",
  },
} satisfies Record<string, FieldHelp>;
