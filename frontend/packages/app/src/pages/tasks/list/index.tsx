/**
 * Internal dependencies.
 */
import { useTaskList } from "./context";
import { TaskListProvider } from "./provider";
import TaskListView from "./view";
import TasksHeader from "../components/header";
import { TaskListSubHeader } from "../components/subHeader";

function TaskListPage() {
  return (
    <TaskListProvider>
      <TaskListPageContent />
    </TaskListProvider>
  );
}

function TaskListPageContent() {
  const openAddTask = useTaskList((c) => c.actions.openAddTaskModal);

  return (
    <>
      <TasksHeader openAddTask={openAddTask} />
      <TaskListSubHeader />
      <TaskListView />
    </>
  );
}

export default TaskListPage;
