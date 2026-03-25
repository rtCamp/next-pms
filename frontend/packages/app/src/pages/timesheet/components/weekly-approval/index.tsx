/**
 * External Dependencies
 */
import { Dialog } from "@base-ui/react/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  TaskStatus,
} from "@next-pms/design-system/components";
import { Avatar, Button, Checkbox } from "@rtcamp/frappe-ui-react";
import { useFrappeGetCall, useFrappeGetDoc } from "frappe-react-sdk";
import {
  ChevronDown,
  X,
  Sparkles,
  CircleX,
  CircleCheck,
  Edit,
} from "lucide-react";

/**
 * Internal Dependencies
 */
import type { WeeklyApprovalProps } from "./types";
import { convertTimesheetToEntries, type TimesheetEntry } from "../../utils";

interface GroupedDay {
  day: string;
  totalHours: number;
  entries: TimesheetEntry[];
}

/**
 * Groups entries by day and calculates total hours per day
 */
const groupEntriesByDay = (entries: TimesheetEntry[]): GroupedDay[] => {
  const grouped = entries.reduce<Record<string, GroupedDay>>((acc, entry) => {
    if (!acc[entry.day]) {
      acc[entry.day] = {
        day: entry.day,
        totalHours: 0,
        entries: [],
      };
    }
    acc[entry.day].totalHours += entry.hours;
    acc[entry.day].entries.push(entry);
    return acc;
  }, {});

  return Object.values(grouped);
};

const WeeklyApproval = ({
  open,
  onOpenChange,
  employee,
  startDate,
}: WeeklyApprovalProps) => {
  const { isLoading, data } = useFrappeGetCall(
    "next_pms.timesheet.api.timesheet.get_timesheet_data",
    {
      employee: employee,
      start_date: startDate,
      max_week: 1,
    },
  );

  const timesheetData = convertTimesheetToEntries(data);
  const groupedByDay = groupEntriesByDay(timesheetData.entries);
  const totalHours = timesheetData.totalHours;
  const dateRange = timesheetData.dateRange;

  const { data: employeeData } = useFrappeGetDoc("Employee", employee);

  const employeeName = employeeData?.employee_name || "";
  const avatarUrl = employeeData?.image || "";

  if (isLoading) {
    return <></>;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100" />
        <Dialog.Popup className="fixed right-0 top-0 w-112 h-[calc(100vh-20px)] m-2.5 z-101 bg-surface-modal rounded-xl shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-4 border-b border-outline-gray-modals">
            <div className="flex items-center gap-3">
              <Avatar size="xs" image={avatarUrl} label={employeeName} />
              <h1 className="text-lg font-medium text-ink-gray-8">
                {employeeName}
              </h1>
              <p className="text-base text-ink-gray-5">{dateRange}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-md font-medium text-ink-green-4">
                {totalHours}
              </span>
              <Dialog.Close className="p-1 hover:bg-surface-gray-2 rounded">
                <X className="h-5 w-5 text-ink-gray-5" />
              </Dialog.Close>
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <Accordion>
              {groupedByDay.map((dayGroup) => (
                <AccordionItem
                  key={dayGroup.day}
                  value={dayGroup.day}
                  className="bg-surface-gray-2 border-b border-outline-gray-modals last:border-b-0"
                >
                  <AccordionTrigger className="w-full flex items-center justify-between px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-ink-gray-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      <span className="text-sm font-medium text-ink-gray-8">
                        {dayGroup.day}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink-green-3">
                        {dayGroup.totalHours}
                      </span>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center"
                      >
                        <Checkbox />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-white">
                    {dayGroup.entries.map((entry) => (
                      <div
                        key={entry.timesheetId}
                        className="px-3.5 py-3 flex gap-3 border-b border-outline-gray-modals last:border-b-0"
                      >
                        <TaskStatus status={entry.status} />
                        <div className="flex-1 min-w-0">
                          <div className="space-y-1">
                            <p className="text-base font-medium text-ink-gray-7">
                              {entry.taskName}
                            </p>
                            <p className="text-xs text-ink-gray-5">
                              {entry.projectName}
                            </p>
                            <p className="text-sm text-ink-gray-7 mt-3">
                              {entry.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-ink-gray-6 shrink-0">
                          {entry.hours}
                        </span>
                        <Edit size={16} className="text-ink-gray-7" />
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between p-3.5 border-t border-outline-gray-modals">
            <Button
              theme="red"
              variant="solid"
              label="Reject"
              iconLeft={() => <CircleX size={16} className="text-white" />}
              onClick={() => onOpenChange(false)}
            />
            <Button
              theme="green"
              variant="solid"
              label="Approve"
              iconLeft={() => <CircleCheck size={16} className="text-white" />}
              onClick={() => onOpenChange(false)}
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default WeeklyApproval;
