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
import { Ellipsis } from "lucide-react";

export type CalendarView = "calendar" | "gantt";

interface CalendarToolbarProps {
  /** ISO date string for the current period, e.g. "2026-01-01" */
  currentPeriodValue: string;
  /** Called when the user picks a date; receives an ISO date string */
  onPeriodChange?: (value: string) => void;
  /** Called when navigating to the previous period */
  onPrevious?: () => void;
  /** Called when navigating to today */
  onToday?: () => void;
  /** Called when navigating to the next period */
  onNext?: () => void;
  /** Currently active view */
  activeView?: CalendarView;
  /** Called when the user switches between Calendar and Gantt views */
  onViewChange?: (view: CalendarView) => void;
  /** Active filter value: "all" | "milestones" | "touchpoints" */
  filterValue?: string;
  /** Called when the filter changes */
  onFilterChange?: (value: string) => void;
}

const filterOptions = [
  { value: "all", label: "All" },
  { value: "milestones", label: "Milestones" },
  { value: "touchpoints", label: "Touchpoints" },
];

export function CalendarToolbar({
  currentPeriodValue,
  onPeriodChange,
  onPrevious,
  onToday,
  onNext,
  activeView = "calendar",
  onViewChange,
  filterValue = "all",
  onFilterChange,
}: CalendarToolbarProps) {
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
            if (v) onPeriodChange?.(v);
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
            onClick={onPrevious}
          />
          <Button variant="ghost" label="Today" onClick={onToday} />
          <Button
            variant="ghost"
            icon={() => <SmallRightChevron className="size-4" />}
            onClick={onNext}
          />
        </div>

        <TabButtons
          value={activeView}
          onChange={(val) => onViewChange?.(val as CalendarView)}
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
          onChange={(val) => onFilterChange?.(val ?? "all")}
          size="sm"
          variant="subtle"
        />

        <Button icon={() => <Ellipsis size={16} />} />
      </div>
    </div>
  );
}

export default CalendarToolbar;
