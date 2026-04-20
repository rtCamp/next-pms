/**
 * External dependencies.
 */
import { Kanban, AlignLeft } from "lucide-react";

export const VIEWS = [
  { key: "list", label: "List view", icon: AlignLeft },
  { key: "kanban", label: "Kanban view", icon: Kanban },
] as const;
