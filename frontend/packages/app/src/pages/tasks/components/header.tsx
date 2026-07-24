/**
 * External dependencies.
 */
import { Breadcrumbs, Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Header } from "@/layout/header";

type TasksHeaderProps = {
  openAddTask: () => void;
};

function TasksHeader({ openAddTask }: TasksHeaderProps) {
  return (
    <Header>
      <Breadcrumbs items={[{ id: "tasks", label: "Tasks" }]} />
      <Button
        variant="solid"
        label="Add Task"
        iconLeft={() => <AddSm size={16} />}
        onClick={openAddTask}
      />
    </Header>
  );
}

export default TasksHeader;
