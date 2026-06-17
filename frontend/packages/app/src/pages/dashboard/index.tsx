/**
 * External dependencies.
 */
import { Typography } from "@next-pms/design-system/components";
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { DASHBOARD_ROLES } from "@/lib/constant";
import { useUser } from "@/providers/user";
import { DASHBOARD_VIEWS } from "./constants";
import { DashboardFilters } from "./dashboardFilters";
import type { DashboardView } from "./types";

function resolveDashboardView(roles: string[]): DashboardView | null {
  if (roles.some((role) => DASHBOARD_ROLES.leadership.includes(role))) {
    return "leadership";
  }
  if (roles.some((role) => DASHBOARD_ROLES.manager.includes(role))) {
    return "manager";
  }
  return null;
}

function Dashboard() {
  const { roles, employeeName, userName } = useUser(({ state }) => ({
    roles: state.roles,
    employeeName: state.employeeName,
    userName: state.userName,
  }));

  const view = resolveDashboardView(roles);
  const firstName = (employeeName || userName).trim().split(" ")[0] || "there";

  if (!view) {
    return (
      <>
        <Header>
          <Breadcrumbs items={[{ id: "dashboard", label: "Dashboard" }]} />
        </Header>
        <div className="flex h-full w-full items-center justify-center">
          <Typography variant="muted">
            You don&apos;t have access to the dashboard.
          </Typography>
        </div>
      </>
    );
  }

  const meta = DASHBOARD_VIEWS[view];

  return (
    <>
      <Header>
        <Breadcrumbs
          items={[
            { id: "dashboard", label: "Dashboard" },
            { id: "view", label: meta.label },
          ]}
        />
      </Header>
      <div className="flex flex-col gap-6 overflow-y-auto p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <Typography variant="h2">Hey, {firstName}.</Typography>
            <Typography variant="muted" className="truncate">
              {meta.context}
            </Typography>
          </div>
          <DashboardFilters />
        </div>
        <section
          data-dashboard-view={view}
          aria-label={`${meta.label} widgets`}
          className="min-h-40"
        />
      </div>
    </>
  );
}

export default Dashboard;
