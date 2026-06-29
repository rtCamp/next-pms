import { ComponentProps } from "react";
import { Tabs } from "@rtcamp/frappe-ui-react";
import { CalendarTab } from "./calendar";
import { EmailTab } from "./email";
import { Feedback } from "./feedback";
import { Notes } from "./notes";
import { Overview } from "./overview";
import { RisksTab } from "./risks";
import { Todo } from "./to-do";
import { Tracking } from "./tracking";

export const TAB_KEYS = [
  "overview",
  "calendar",
  "tracking",
  "risks",
  "notes",
  "email",
  "to-do",
  "feedback",
] as const;

export type TabKey = (typeof TAB_KEYS)[number];

export const TABS: ComponentProps<typeof Tabs>["tabs"] = [
  { label: "Overview", content: <Overview /> },
  { label: "Calendar", content: <CalendarTab /> },
  { label: "Tracking", content: <Tracking /> },
  { label: "Risks", content: <RisksTab /> },
  { label: "Notes", content: <Notes /> },
  { label: "Email", content: <EmailTab /> },
  { label: "To-do", content: <Todo /> },
  { label: "Feedback", content: <Feedback /> },
] as const;
