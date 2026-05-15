import { PHASES, RAG_STATUS } from "./constants";

export type ListViewColumn = { key: string; label: string; width?: string };

export type Phase = (typeof PHASES)[number];

export type RagStatus = (typeof RAG_STATUS)[number];

export type ProjectType = "Fixed cost" | "Retainer" | "External";
