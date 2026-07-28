/**
 * External dependencies.
 */
import {
  Button,
  DatePicker,
  Select,
  TabButtons,
} from "@rtcamp/frappe-ui-react";
import {
  SmallLeftChevron,
  SmallRightChevron,
  SmallDown,
} from "@rtcamp/frappe-ui-react/icons";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { useCalendar } from "./context";
import type { CalendarView } from "./types";

const filterOptions = [
  { value: "all", label: "All" },
  { value: "milestones", label: "Milestones" },
  { value: "touchpoints", label: "Touchpoints" },
];

export function CalendarToolbar() {
  const currentDate = useCalendar((c) => c.state.currentDate);
  const activeView = useCalendar((c) => c.state.activeView);
  const filterValue = useCalendar((c) => c.state.filterType);
  const handlePeriodChange = useCalendar((c) => c.actions.handlePeriodChange);
  const goToPrev = useCalendar((c) => c.actions.goToPrev);
  const goToToday = useCalendar((c) => c.actions.goToToday);
  const goToNext = useCalendar((c) => c.actions.goToNext);
  const setActiveView = useCalendar((c) => c.actions.setActiveView);
  const setFilterType = useCalendar((c) => c.actions.setFilterType);

  const currentPeriodValue = format(currentDate, "yyyy-MM-dd");

  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center">
        <DatePicker
          value={currentPeriodValue}
          formatter={(d) => format(parseISO(d), "MMMM yyyy")}
          placement="bottom-start"
          clearable={false}
          onChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val;
            if (v) handlePeriodChange(v);
          }}
        >
          {({ displayValue }) => (
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span className="text-lg font-medium text-ink-gray-7 whitespace-nowrap mr-2">
                {displayValue}
              </span>
              <SmallDown className="size-4 shrink-0" />
            </Button>
          )}
        </DatePicker>
      </div>

      <div className="flex items-center justify-end gap-2">
        <div className="flex items-center py-0.5">
          <Button
            variant="ghost"
            icon={() => <SmallLeftChevron className="size-4" />}
            onClick={goToPrev}
          />
          <Button
            className="text-ink-gray-7"
            variant="ghost"
            label="Today"
            onClick={goToToday}
          />
          <Button
            variant="ghost"
            icon={() => <SmallRightChevron className="size-4" />}
            onClick={goToNext}
          />
        </div>

        <TabButtons
          value={activeView}
          onChange={(val) => setActiveView(val as CalendarView)}
          buttonClassName="text-ink-gray-5 data-pressed:text-ink-gray-8"
          buttons={[
            { label: "Calendar", value: "calendar" },
            { label: "Gantt", value: "gantt" },
          ]}
        />

        <Select
          className="w-min"
          value={filterValue}
          options={filterOptions}
          onChange={(val) => setFilterType(val ?? "all")}
          size="sm"
          variant="subtle"
        />
      </div>
    </div>
  );
}

export default CalendarToolbar;
