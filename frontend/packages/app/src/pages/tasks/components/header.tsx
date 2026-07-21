/**
 * External dependencies.
 */
import { Breadcrumbs, Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";

function TasksHeader() {
  return (
    <Header>
      <Breadcrumbs items={[{ id: "tasks", label: "Tasks" }]} />
      <Button
        variant="solid"
        label="Add task"
        iconLeft={() => <AddSm />}
        onClick={() => {}}
      />
    </Header>
  );
}

export default TasksHeader;
