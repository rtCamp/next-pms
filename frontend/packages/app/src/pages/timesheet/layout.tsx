/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getTodayDate } from "@next-pms/design-system";
import {
  Breadcrumbs,
  Button,
  Folder,
  People,
  Time,
} from "@rtcamp/frappe-ui-react";
import { CalendarX2, ChevronDown, Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { ROUTES } from "@/lib/constant";
import AddLeave from "@/pages/timesheet/components/add-leave";
import AddTime from "@/pages/timesheet/components/add-time";
import SubmitApproval from "@/pages/timesheet/components/submit-approval";
import { useUser } from "@/providers/user";
import type { TimesheetOutletContext } from "./outletContext";

function TimesheetLayout() {
  const navigate = useNavigate();
  const hasRoleAccess = useUser(({ state }) => state.hasRoleAccess);
  const [initialDate, setInitialDate] = useState(getTodayDate());
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isSubmitApprovalOpen, setIsSubmitApprovalOpen] = useState(false);
  const [submitApprovalDates, setSubmitApprovalDates] = useState({
    startDate: "",
    endDate: "",
    totalHours: 0,
  });

  const handleAddTime = useCallback((date?: string) => {
    setInitialDate(date || getTodayDate());
    setIsTimeDialogOpen(true);
  }, []);

  const handleApproval = useCallback(
    (startDate: string, endDate: string, totalHours: number) => {
      setSubmitApprovalDates({ startDate, endDate, totalHours });
      setIsSubmitApprovalOpen(true);
    },
    [],
  );

  const { pathname } = useLocation();

  const timesheetViews = [
    {
      key: "personal",
      label: "Personal",
      to: ROUTES["timesheet-personal"],
      icon: Time,
    },

    {
      key: "team",
      label: "Team",
      to: ROUTES["timesheet-team"],
      icon: People,
    },
    {
      key: "project",
      label: "Project",
      to: ROUTES["timesheet-project"],
      icon: Folder,
    },
  ] as const;

  const selectedKey = pathname.includes("team")
    ? "team"
    : pathname.includes("project")
      ? "project"
      : "personal";

  const activeView = timesheetViews.find((v) => v.key === selectedKey)!;

  return (
    <>
      <Header className="justify-between">
        <Breadcrumbs
          items={[
            {
              id: "timesheets",
              label: "Timesheets",
              interactive: false,
            },
            {
              id: "personal",
              label: activeView.label,
              prefixIcon: <activeView.icon className="size-4" />,
              interactive: hasRoleAccess,
              suffixIcon: hasRoleAccess ? (
                <ChevronDown className="w-4 h-4" />
              ) : undefined,
              dropdown: hasRoleAccess
                ? {
                    dropdownClassName: "w-[220px] px-1",
                    groupClassName: "px-0 py-1 space-y-1",
                    itemClassName: "text-ink-gray-8 hover:text-ink-gray-7",
                    selectedKey: selectedKey,
                    selectedGroupKey: "views-group",
                    options: [
                      {
                        group: "",
                        key: "views-group",
                        items: timesheetViews.map((v) => ({
                          label: v.label,
                          key: v.key,
                          icon: <v.icon className="size-4 mr-2" />,
                          onClick: () => navigate(v.to),
                        })),
                      },
                    ],
                  }
                : undefined,
            },
          ]}
        />
        <div className="flex gap-2">
          {window.frappe?.boot?.user?.can_create.includes(
            "Leave Application",
          ) && (
            <Button
              onClick={() => setIsLeaveDialogOpen(true)}
              label="Add time-off"
              iconLeft={() => <CalendarX2 />}
            />
          )}

          <Button
            variant="solid"
            onClick={() => handleAddTime()}
            label="Add time"
            iconLeft={() => <Plus />}
          />
        </div>
      </Header>
      <Outlet
        context={
          {
            openAddTimeDialog: handleAddTime,
            openAddLeaveDialog: () => setIsLeaveDialogOpen(true),
            handleApproval,
          } satisfies TimesheetOutletContext
        }
      />

      <AddTime
        initialDate={initialDate}
        open={isTimeDialogOpen}
        onOpenChange={setIsTimeDialogOpen}
        onSuccess={() => setIsTimeDialogOpen(false)}
      />
      <AddLeave open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen} />
      <SubmitApproval
        open={isSubmitApprovalOpen}
        onOpenChange={setIsSubmitApprovalOpen}
        startDate={submitApprovalDates.startDate}
        endDate={submitApprovalDates.endDate}
        totalHours={submitApprovalDates.totalHours}
      />
    </>
  );
}

export default TimesheetLayout;
