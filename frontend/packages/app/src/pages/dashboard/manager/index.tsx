/**
 * External dependencies.
 */
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { useUser } from "@/providers/user";
import AssignedProjects from "../widget/assigned-projects";
import CalendarTimelineCard from "../widget/calendar-timeline";
import HeatmapCard from "../widget/heatmap";
import NotificationsCard from "../widget/notificationsCard";
import LiveStatCard from "../widget/stat-cards";
import Timesheets from "../widget/timesheet-summary";
import UpcomingTimeOff from "../widget/upcoming-time-off";

export default function ManagerDashboard() {
  const { employeeName, userName } = useUser(({ state }) => ({
    employeeName: state.employeeName,
    userName: state.userName,
  }));

  const firstName = (employeeName || userName).trim().split(" ")[0] || "there";

  return (
    <>
      <Header>
        <Breadcrumbs
          items={[
            { id: "dashboard", label: "Dashboard" },
            { id: "leadership", label: "Management" },
          ]}
        />
      </Header>
      <div className="flex flex-col gap-6 overflow-y-auto p-5 max-w-[1200px] mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h2 className="text-xl font-semibold text-ink-gray-8">
              Hey, {firstName}
            </h2>
          </div>
        </div>

        <section
          aria-label="Leadership dashboard"
          className="flex flex-col gap-3 overflow-y-auto scrollbar-thin"
        >
          <div className="grid grid-cols-4 gap-3">
            <LiveStatCard />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <HeatmapCard />
            </div>
            <NotificationsCard />
          </div>
          <CalendarTimelineCard />
          <AssignedProjects />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Timesheets />
            </div>
            <UpcomingTimeOff />
          </div>
        </section>
      </div>
    </>
  );
}
