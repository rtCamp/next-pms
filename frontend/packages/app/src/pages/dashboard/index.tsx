/**
 * External dependencies.
 */
import { useState } from "react";
import { Breadcrumbs, Combobox } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";
import { useUser } from "@/providers/user";
import {
  ALL_CLIENTS_VALUE,
  ALL_PROJECTS_VALUE,
  MOCK_CLIENT_OPTIONS,
  MOCK_PROJECT_OPTIONS,
} from "./constants";
import { LeadershipView } from "./leadership-view";
import { ManagerView } from "./manager-view";

function Dashboard() {
  const [client, setClient] = useState<string>(ALL_CLIENTS_VALUE);
  const [project, setProject] = useState<string>(ALL_PROJECTS_VALUE);
  const { roles, employeeName, userName } = useUser(({ state }) => ({
    roles: state.roles,
    employeeName: state.employeeName,
    userName: state.userName,
  }));

  const firstName = (employeeName || userName).trim().split(" ")[0] || "there";

  return (
    <>
      <Header>
        <Breadcrumbs items={[{ id: "dashboard", label: "Dashboard" }]} />
      </Header>
      <div className="flex flex-col gap-6 overflow-y-auto p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <h2 className="text-xl font-semibold text-ink-gray-8">
              Hey, {firstName}
            </h2>
            <h2 className="text-base text-ink-gray-7">Placeholder text</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Combobox
              className="w-fit rounded-lg border-outline-gray-1 bg-white px-2 py-1.5 text-sm text-ink-gray-7"
              inputClassName="bg-white"
              options={MOCK_CLIENT_OPTIONS}
              value={client}
              onChange={(value) => setClient(value ?? ALL_CLIENTS_VALUE)}
            />
            <Combobox
              className="w-fit rounded-lg border-outline-gray-1 bg-white px-2 py-1.5 text-sm text-ink-gray-7"
              inputClassName="bg-white"
              options={MOCK_PROJECT_OPTIONS}
              value={project}
              onChange={(value) => setProject(value ?? ALL_PROJECTS_VALUE)}
            />
          </div>
        </div>
        {roles.includes("Delivery Manager") && <LeadershipView />}
        {roles.includes("Projects Manager") && <ManagerView />}
      </div>
    </>
  );
}

export default Dashboard;
