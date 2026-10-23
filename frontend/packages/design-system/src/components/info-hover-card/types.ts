/**
 * External dependencies.
 */
import type { ComponentType, ReactNode } from "react";

export type LegendItem = {
  label: string;
  /** Classes copied from the UI being explained, applied to the sample. */
  className?: string;
  /** Short text drawn with `className`, e.g. "8:00" or a pill's name. */
  sample?: string;
  /** Shown instead of a text sample when the UI uses icons. */
  icon?: ComponentType<{ className?: string }>;
  /** Classes for a dot under the sample, e.g. the non-billable marker. */
  marker?: string;
  /** A sample rendered from outside, e.g. a real gantt bar. */
  children?: ReactNode;
};

export type FieldHelp = {
  title: string;
  summary: string;
  formula?: string;
  legend?: LegendItem[];
  details?: string[];
  /** Page and anchor under WIKI_BASE, e.g. "Leadership-Dashboard#heatmap". */
  wiki?: string;
};

export type InfoHoverCardProps = { className?: string } & (
  | { help: FieldHelp; tooltip?: never }
  /** Short text shown in a tooltip, for places a card can't open from, e.g. inside a hover card. */
  | { tooltip: string; help?: never }
);
