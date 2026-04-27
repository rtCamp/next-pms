import { ComponentProps } from "react";
import { Tabs } from "@rtcamp/frappe-ui-react";
import { UnderConstruction } from "@/components/under-construction";

export const TABS: ComponentProps<typeof Tabs>["tabs"] = [
  { label: "Overview", content: <UnderConstruction /> },
  { label: "Calendar", content: <UnderConstruction /> },
  { label: "Tracking", content: <UnderConstruction /> },
  { label: "Risks", content: <UnderConstruction /> },
  { label: "Notes", content: <UnderConstruction /> },
  { label: "Email", content: <UnderConstruction /> },
  { label: "To-do", content: <UnderConstruction /> },
  { label: "Feedback", content: <UnderConstruction /> },
];
