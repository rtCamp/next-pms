/**
 * External Dependencies
 */
import { Dialog } from "@base-ui/react/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@next-pms/design-system/components";
import { Avatar, Button, Checkbox } from "@rtcamp/frappe-ui-react";
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

// Hardcoded data based on the design
const EMPLOYEE_DATA = {
  name: "Julian Andrews",
  avatar: "",
  dateRange: "Dec 15 - 21",
  totalHours: "40:45",
};

const TIMESHEET_DATA = [
  {
    id: "mon",
    day: "Mon, Dec 15",
    isFirstHalfOff: false,
    totalHours: "08:45",
    entries: [
      {
        id: "1",
        title: "Design system component refinements",
        project: "Atlas UI Stabilization",
        hours: "00:45",
        description:
          "Fixed spacing and alignment inconsistencies and resolved visual styling issues across components",
        icon: "sparkles",
      },
      {
        id: "2",
        title: "Design system component refinements",
        project: "Atlas UI Stabilization",
        hours: "02:10",
        description:
          "Updated component states to match latest UI guidelines and ensured consistency and reusability across screens",
        icon: "sparkles",
      },
      {
        id: "3",
        title: "Client dashboard layout improvements",
        project: "Atlas UI Stabilisation",
        hours: "02:15",
        description:
          "Fixed spacing and alignment inconsistencies and resolved visual styling issues across components",
        icon: "check",
      },
    ],
  },
  {
    id: "tue",
    day: "Tue, Dec 16",
    isFirstHalfOff: false,
    totalHours: "08:00",
    entries: [
      {
        id: "4",
        title: "Design system component refinements",
        project: "Atlas UI Stabilization",
        hours: "05:00",
        description:
          "Reviewed existing design system components and documented visual inconsistencies and spacing issues across commonly used components.",
        icon: "sparkles",
      },
      {
        id: "5",
        title: "Client dashboard layout improvements",
        project: "Atlas UI Stabilisation",
        hours: "03:00",
        description:
          "Analyzed the existing dashboard layout to identify content hierarchy and usability gaps.",
        icon: "check",
      },
    ],
  },
  {
    id: "wed",
    day: "Wed, Dec 17",
    totalHours: "08:00",
    isFirstHalfOff: true,
    entries: [
      {
        id: "6",
        title: "Design system component refinements",
        project: "Atlas UI Stabilization",
        hours: "02:00",
        description: null,
        bulletPoints: ["Fixed spacing and alignment issues in shared"],
        icon: "sparkles",
      },
    ],
  },
];

const WeeklyApproval = ({ open, onOpenChange }: WeeklyApprovalProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100" />
        <Dialog.Popup className="fixed right-0 top-0 w-112 h-[calc(100vh-20px)] m-2.5 z-101 bg-surface-modal rounded-xl shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-4 border-b border-outline-gray-modals">
            <div className="flex items-center gap-3">
              <Avatar
                size="xs"
                image={EMPLOYEE_DATA.avatar}
                label={EMPLOYEE_DATA.name}
              />
              <h1 className="text-lg font-medium text-ink-gray-8">
                {EMPLOYEE_DATA.name}
              </h1>
              <p className="text-base text-ink-gray-5">
                {EMPLOYEE_DATA.dateRange}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-md font-medium text-ink-green-4">
                {EMPLOYEE_DATA.totalHours}
              </span>
              <Dialog.Close className="p-1 hover:bg-surface-gray-2 rounded">
                <X className="h-5 w-5 text-ink-gray-5" />
              </Dialog.Close>
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <Accordion>
              {TIMESHEET_DATA.map((day) => (
                <AccordionItem
                  key={day.id}
                  value={day.id}
                  className="bg-surface-gray-2 border-b border-outline-gray-modals last:border-b-0"
                >
                  <AccordionTrigger className="w-full flex items-center justify-between px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-ink-gray-5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      <span className="text-sm font-medium text-ink-gray-8">
                        {day.day}
                      </span>
                      {day.isFirstHalfOff && (
                        <p className="text-base text-ink-gray-5">
                          First Half off
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink-green-3">
                        {day.totalHours}
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
                    {day.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="px-3.5 py-3 flex gap-3 border-b border-outline-gray-modals last:border-b-0"
                      >
                        <Sparkles size={16} className="text-ink-gray-5" />
                        <div className="flex-1 min-w-0">
                          <div className="space-y-1">
                            <p className="text-base font-medium text-ink-gray-7">
                              {entry.title}
                            </p>
                            <p className="text-xs text-ink-gray-5">
                              {entry.project}
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
