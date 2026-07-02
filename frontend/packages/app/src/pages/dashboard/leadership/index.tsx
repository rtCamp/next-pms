/**
 * External dependencies.
 */
import { useState } from "react";
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { useUser } from "@/providers/user";
import CalendarTimelineCard from "../widget/calendar-timeline";
import WidgetCard from "../widget/components/card";
import ForecastBreakdownCard from "../widget/forecast-breakdown";
import HeatmapCard from "../widget/heatmap";
import LeadershipKpiCard from "../widget/kpi-cards";
import { getDefaultKpiMonth } from "../widget/kpi-cards/useLeadershipKpi";
import NotificationsCard from "../widget/notificationsCard";
import LiveStatCard from "../widget/stat-cards";
import UtilisedTimeCard from "../widget/utilization";

export default function LeadershipDashboard() {
  const { employeeName, userName } = useUser(({ state }) => ({
    employeeName: state.employeeName,
    userName: state.userName,
  }));

  const firstName = (employeeName || userName).trim().split(" ")[0] || "there";
  const [kpiMonth, setKpiMonth] = useState(getDefaultKpiMonth);

  return (
    <>
      <Header>
        <Breadcrumbs
          items={[
            { id: "dashboard", label: "Dashboard" },
            { id: "leadership", label: "Leadership" },
          ]}
        />
      </Header>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-5 space-y-6 max-w-[1200px] mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h2 className="text-2xl font-semibold text-ink-gray-8">
              Hey, {firstName}
            </h2>
          </div>
        </div>

        <section
          aria-label="Leadership dashboard"
          className="grid grid-cols-12 gap-3"
        >
          <WidgetCard className="col-span-4">
            <LeadershipKpiCard
              kpikey={"revenue"}
              month={kpiMonth}
              onMonthChange={setKpiMonth}
            />
          </WidgetCard>
          <WidgetCard className="col-span-4">
            <LeadershipKpiCard
              kpikey={"cost"}
              month={kpiMonth}
              onMonthChange={setKpiMonth}
            />
          </WidgetCard>
          <WidgetCard className="col-span-4">
            <LeadershipKpiCard
              kpikey={"profit_margin"}
              month={kpiMonth}
              onMonthChange={setKpiMonth}
            />
          </WidgetCard>
          <WidgetCard className="h-[300px] col-span-8 p-4">
            <HeatmapCard />
          </WidgetCard>
          <WidgetCard className="h-[300px] col-span-4 p-4">
            <NotificationsCard />
          </WidgetCard>
          <div className="col-span-12">
            <LiveStatCard />
          </div>
          <WidgetCard className="col-span-6 gap-4 p-4">
            <UtilisedTimeCard />
          </WidgetCard>
          <WidgetCard className="col-span-6 gap-4 p-4 h-full">
            <ForecastBreakdownCard />
          </WidgetCard>
          <WidgetCard className="col-span-12 gap-3 p-0">
            <CalendarTimelineCard />
          </WidgetCard>
        </section>
      </div>
    </>
  );
}
