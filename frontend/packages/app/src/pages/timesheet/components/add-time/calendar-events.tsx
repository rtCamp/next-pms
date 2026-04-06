/**
 * External Dependencies
 */
import { useState } from "react";
import { useId } from "react";
import {
  formatDateTimeLabel,
  formatDurationLabel,
} from "@next-pms/design-system";
import { Checkbox, Badge } from "@rtcamp/frappe-ui-react";
import { Calendar, Clock } from "lucide-react";

/**
 * Internal Dependencies
 */
import type { CalendarEvent } from "./type";

interface CalendarEventsProps {
  events: CalendarEvent[];
  onSelectionChange: (selectedLabels: string[]) => void;
}

const CalendarEvents = ({ events, onSelectionChange }: CalendarEventsProps) => {
  const id = useId();
  const [show, setShow] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isCalendarSetup = window.frappe?.boot?.is_calendar_setup ?? false;

  const notifySelectionChange = (nextIds: string[]) => {
    const selectedLabels = events
      .filter((e) => nextIds.includes(e.id))
      .map(
        (e) =>
          `${e.subject.trim()} | ${formatDurationLabel(e.starts_on, e.ends_on)}`,
      )
      .filter(Boolean);

    onSelectionChange(selectedLabels);
  };

  const handleToggleShow = (val: boolean) => {
    setShow(val);
    if (!val) {
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  const handleSelectAll = (val: boolean) => {
    setSelectAll(val);
    const nextIds = val ? events.map((e) => e.id) : [];
    setSelectedIds(nextIds);
    notifySelectionChange(nextIds);
  };

  const handleToggleEvent = (eventId: string, checked: boolean) => {
    const nextIds = checked
      ? [...selectedIds, eventId]
      : selectedIds.filter((id) => id !== eventId);

    setSelectedIds(nextIds);
    setSelectAll(nextIds.length === events.length && events.length > 0);
    notifySelectionChange(nextIds);
  };

  return (
    <>
      <div className="flex gap-1 items-center">
        <Checkbox
          htmlId={`${id}_add_calendar_events`}
          disabled={!isCalendarSetup}
          label="Add calendar events"
          value={show}
          onChange={handleToggleShow}
        />

        {!isCalendarSetup && (
          <a href="#" className="px-2 text-base text-ink-gray-7">
            Enable
          </a>
        )}
      </div>

      {show && (
        <div className="px-2.5 py-2 rounded border border-outline-gray-2">
          {events.length === 0 ? (
            <p className="py-2 text-base text-center text-ink-gray-5">
              No events found for the selected date.
            </p>
          ) : (
            <>
              <div className="flex justify-between border-b border-outline-gray-1 pb-2.5 text-base text-ink-gray-5 mb-2.5">
                <Checkbox
                  htmlId={`${id}_select_all`}
                  label="Select all"
                  extraLabelClasses="text-base text-ink-gray-5"
                  value={selectAll}
                  onChange={handleSelectAll}
                />
                <span>
                  {selectedIds.length} of {events.length}
                </span>
              </div>

              <div className="flex overflow-y-auto flex-col gap-3 max-h-40 scrollbar-thin">
                {events.map((event) => {
                  const localDate = formatDateTimeLabel(
                    event.starts_on,
                    "MMM d",
                  );
                  const localStartTime = formatDateTimeLabel(
                    event.starts_on,
                    "p",
                  );
                  const localEndTime = formatDateTimeLabel(event.ends_on, "p");

                  return (
                    <div key={event.id}>
                      <Checkbox
                        htmlId={`${id}_event_${event.id}`}
                        label={event.subject}
                        extraLabelClasses="text-ink-gray-8 text-base"
                        value={selectedIds.includes(event.id)}
                        onChange={(checked) =>
                          handleToggleEvent(event.id, checked)
                        }
                      />
                      <div className="flex gap-1 ml-5">
                        <Badge
                          label={localDate}
                          prefix={<Calendar className="size-3" />}
                        />
                        <Badge
                          label={`${localStartTime} - ${localEndTime}`}
                          prefix={<Clock className="size-3" />}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default CalendarEvents;
