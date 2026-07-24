/**
 * External dependencies.
 */
import { Breadcrumbs } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";

function TasksHeader() {
  return (
    <Header>
      <Breadcrumbs items={[{ id: "tasks", label: "Tasks" }]} />
    </Header>
  );
}

export default TasksHeader;
