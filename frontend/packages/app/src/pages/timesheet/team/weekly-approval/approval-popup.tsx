/**
 * External Dependencies
 */
import { Accordion } from "@base-ui/react/accordion";
import { Dialog } from "@base-ui/react/dialog";
import { floatToTime } from "@next-pms/design-system";
import { Avatar, Button, Checkbox } from "@rtcamp/frappe-ui-react";
import { ChevronDown, X, CircleX, CircleCheck } from "lucide-react";

/**
 * Internal Dependencies
 */
import EntryRow from "./entry-row";
import type { TimesheetEntry } from "../../utils";

interface GroupedDay {
  day: string;
  totalHours: number;
  entries: TimesheetEntry[];
}

interface ApprovalPopupProps {
  employeeName: string;
  avatarUrl: string;
  dateRange: string;
  totalHours: number;
  groupedByDay: GroupedDay[];
  checkedDays: Set<string>;
  onDayCheckChange: (day: string, checked: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
}

const ApprovalPopup = ({
  employeeName,
  avatarUrl,
  dateRange,
  totalHours,
  groupedByDay,
  checkedDays,
  onDayCheckChange,
  onApprove,
  onReject,
}: ApprovalPopupProps) => {
  const handleEntrySave = (
    timesheetId: string,
    updates: { description: string; hours: number },
  ) => {
    console.log("Saving entry:", timesheetId, updates);
    // TODO: Call API to update the entry
  };

  return (
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
            {floatToTime(totalHours, 2, 2)}
          </span>
          <Dialog.Close className="hover:bg-surface-gray-2 rounded">
            <X className="h-5 w-5 text-ink-gray-5" />
          </Dialog.Close>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Accordion.Root
          multiple
          defaultValue={groupedByDay.map((dayGroup) => dayGroup.day)}
        >
          {groupedByDay.map((dayGroup) => (
            <Accordion.Item
              key={dayGroup.day}
              value={dayGroup.day}
              className="bg-surface-gray-2 border-b border-outline-gray-modals last:border-b-0"
            >
              <Accordion.Trigger className="w-full flex items-center justify-between px-3.5 py-3 group">
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 text-ink-gray-5 transition-transform duration-200 group-data-[panel-open]:rotate-180" />
                  <span className="text-sm font-medium text-ink-gray-8">
                    {dayGroup.day}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-md font-semibold text-ink-green-3">
                    {floatToTime(dayGroup.totalHours, 2, 2)}
                  </span>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center"
                  >
                    <Checkbox
                      value={checkedDays.has(dayGroup.day)}
                      onChange={(checked) =>
                        onDayCheckChange(dayGroup.day, checked)
                      }
                    />
                  </div>
                </div>
              </Accordion.Trigger>
              <Accordion.Panel className="bg-white">
                {dayGroup.entries.map((entry) => (
                  <EntryRow
                    key={entry.timesheetId}
                    entry={entry}
                    onSave={handleEntrySave}
                  />
                ))}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between p-3.5 border-t border-outline-gray-modals">
        <Button
          theme="red"
          variant="solid"
          label="Reject"
          iconLeft={() => <CircleX size={16} className="text-white" />}
          onClick={onReject}
        />
        <Button
          theme="green"
          variant="solid"
          label="Approve"
          iconLeft={() => <CircleCheck size={16} className="text-white" />}
          onClick={onApprove}
        />
      </div>
    </Dialog.Popup>
  );
};

export default ApprovalPopup;
