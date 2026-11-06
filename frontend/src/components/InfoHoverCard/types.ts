import type { Component } from "vue";

/** One row of a card's legend: a sample of the UI being explained and what it means. */
export interface LegendItem {
  label: string;
  /** Classes copied from the UI being explained, applied to the sample. */
  class?: string;
  /** Short text drawn with `class`, e.g. "8:00" or a pill's name. */
  sample?: string;
  /** lucide icon class shown instead of a text sample, e.g. `"lucide-circle-check"`. */
  icon?: string;
  /** Classes for a dot under the sample, e.g. the non-billable marker. */
  marker?: string;
  /** A sample rendered by a component, e.g. a real budget burn bar, with its `props`. */
  component?: Component;
  props?: Record<string, unknown>;
}

/** What an info card explains about a field, a column or a widget. */
export interface FieldHelp {
  title: string;
  summary: string;
  formula?: string;
  legend?: LegendItem[];
  details?: string[];
  /** Page and anchor in the wiki, e.g. "Leadership-Dashboard#heatmap"; not shown for now. */
  wiki?: string;
}

export type InfoHoverCardProps =
  | {
      /** The card that opens on hover or focus. */
      help: FieldHelp;
      tooltip?: never;
    }
  | {
      help?: never;
      /** Short text shown in a tooltip, for places a card can't open from, e.g. inside a hover card. */
      tooltip: string;
    };
