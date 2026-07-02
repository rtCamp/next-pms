/**
 * Internal dependencies.
 */
import { Tooltip } from "@rtcamp/frappe-ui-react";
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
  <Tooltip text={title + "-" + subtitle}>
    <div className={eventChipVariants({ color })}>
      <p className={eventChipTitleVariants({ color })}>{title}</p>
      {subtitle && (
        <p className={eventChipSubtitleVariants({ color })}>{subtitle}</p>
      )}
    </div>
  </Tooltip>
);

export default EventChip;
