/**
 * External dependencies.
 */
import type { ComponentType } from "react";

export type LegendItem = {
  label: string;
  /** Classes copied from the UI being explained, applied to the sample. */
  className: string;
  /** Short text drawn with `className`, e.g. "8:00" or a pill's name. */
  sample?: string;
  /** Shown instead of a text sample when the UI uses icons. */
  icon?: ComponentType<{ className?: string }>;
  /** Classes for a dot under the sample, e.g. the non-billable marker. */
  marker?: string;
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

export type InfoHoverCardProps = {
  help: FieldHelp;
  className?: string;
};
