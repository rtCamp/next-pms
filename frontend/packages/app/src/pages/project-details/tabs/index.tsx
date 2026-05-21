import { ComponentProps } from "react";
import { Tabs } from "@rtcamp/frappe-ui-react";
import { UnderConstruction } from "@/components/under-construction";
import { CalendarTab } from "./calendar";
import { Overview } from "./overview";
import { Tracking } from "./tracking";

export const TABS: ComponentProps<typeof Tabs>["tabs"] = [
  { label: "Overview", content: <Overview /> },
  { label: "Calendar", content: <CalendarTab /> },
  { label: "Tracking", content: <Tracking /> },
  { label: "Risks", content: <UnderConstruction /> },
  { label: "Notes", content: <UnderConstruction /> },
  { label: "Email", content: <UnderConstruction /> },
  { label: "To-do", content: <UnderConstruction /> },
  { label: "Feedback", content: <UnderConstruction /> },
] as const;
