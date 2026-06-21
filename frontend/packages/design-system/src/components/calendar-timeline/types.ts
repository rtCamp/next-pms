/**
 * External dependencies.
 */
import type { ReactNode } from "react";

export type CalendarEventColor = "violet" | "blue";

export interface CalendarTimelineEvent {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  color?: CalendarEventColor;
}

export interface CalendarTimelineProps {
  events: CalendarTimelineEvent[];
  rangeStart: Date;
  days?: number;
  today?: Date;
  rangeLabel?: string;
  filterSlot?: ReactNode;
  /**
   * Replaces the entire built-in header (range label, navigation, filter).
   * The host owns the full header layout when this is provided.
   */
  headerSlot?: ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
}
