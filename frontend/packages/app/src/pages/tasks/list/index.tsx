/**
 * Internal dependencies.
 */
import { TaskListProvider } from "./provider";
import TaskListView from "./view";
import TasksHeader from "../components/header";
import { TaskListSubHeader } from "../components/subHeader";

function TaskListPage() {
  return (
    <TaskListProvider>
      <TasksHeader />
      <TaskListSubHeader />
      <TaskListView />
    </TaskListProvider>
  );
}

export default TaskListPage;
