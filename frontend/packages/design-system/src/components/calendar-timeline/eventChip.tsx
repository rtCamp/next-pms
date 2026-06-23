/**
 * Internal dependencies.
 */
import {
  eventChipSubtitleVariants,
  eventChipTitleVariants,
  eventChipVariants,
} from "./constants";
import type { CalendarEventColor } from "./types";

interface EventChipProps {
  title: string;
  subtitle?: string;
  color?: CalendarEventColor;
}

const EventChip = ({ title, subtitle, color = "blue" }: EventChipProps) => (
  <div className={eventChipVariants({ color })}>
    <p className={eventChipTitleVariants({ color })}>{title}</p>
    {subtitle && (
      <p className={eventChipSubtitleVariants({ color })}>{subtitle}</p>
    )}
  </div>
);

export default EventChip;
