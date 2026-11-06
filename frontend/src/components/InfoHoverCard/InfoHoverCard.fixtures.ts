import { BudgetBurnBar } from "@/components/BudgetBurnBar";
import type { FieldHelp } from "./types";

export const BASIC_HELP: FieldHelp = {
  title: "Utilisation",
  summary: "How much of the team's available time went into logged work.",
};

export const FULL_HELP: FieldHelp = {
  title: "Cost burn",
  summary:
    "How much of the target cost is used so far, and how much is forecast.",
  formula: "Cost burn = actual cost ÷ target cost",
  legend: [
    {
      label: "Approved",
      icon: "lucide-circle-check",
      class: "text-ink-green-6",
    },
    {
      label: "Non-billable hours",
      sample: "8:00",
      class: "text-ink-gray-7",
      marker: "bg-surface-amber-7",
    },
    {
      label: "Used so far",
      component: BudgetBurnBar,
      props: { value: 40, size: "sm", class: "w-20" },
    },
  ],
  details: [
    "Actual cost comes from approved timesheets.",
    "The forecast comes from the remaining allocations.",
  ],
};

export const TOOLTIP = "Hours left after this allocation";
