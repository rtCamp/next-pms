/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from "react";
import { ErrorFallback, Table, TableBody } from "@next-pms/design-system/components";
/**
 * Internal dependencies
 */
import { TaskLog } from "@/app/pages/task/components/taskLog";
import { LIKED_TASK_KEY } from "@/lib/constant";
import { getLocalStorage, hasKeyInLocalStorage, removeFromLikedTask, setLikedTask } from "@/lib/storage";
import { expectatedHours, getHolidayList } from "@/lib/utils";
import { WorkingFrequency } from "@/types";
import { HolidayProp, LeaveProps, TaskDataProps, TaskProps } from "@/types/timesheet";
import { Header } from "./components/header";
import { Row } from "./components/row";
import { EmptyRow } from "./components/row/emptyRow";
import { LeaveRow } from "./components/row/leaveRow";
import { TotalHourRow } from "./components/row/totalRow";

type timesheetTableProps = {
  dates: string[];
  holidays: Array<HolidayProp>;
  tasks: TaskProps;
  leaves: Array<LeaveProps>;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  onCellClick?: (data) => void;
  showHeading?: boolean;
  workingHour: number;
  disabled?: boolean;
  workingFrequency: WorkingFrequency;
  weeklyStatus?: string;
  importTasks?: boolean;
  loadingLikedTasks?: boolean;
  likedTaskData?: Array<object>;
  getLikedTaskData?: () => void;
  hideLikeButton?:boolean;
};

export const TimesheetTable = ({
  dates,
  holidays,
  tasks,
  leaves,
  onCellClick,
  showHeading = true,
  workingHour,
  workingFrequency,
  disabled,
  weeklyStatus,
  importTasks = false,
  loadingLikedTasks,
  likedTaskData,
  getLikedTaskData,
  hideLikeButton,
}: timesheetTableProps) => {
  const holidayList = getHolidayList(holidays);
  const [isTaskLogDialogBoxOpen, setIsTaskLogDialogBoxOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const task_date_range_key = dates[0] + "-" + dates[dates.length - 1];
  const has_liked_task = hasKeyInLocalStorage(LIKED_TASK_KEY);

  const setTaskInLocalStorage = () => {
    setLikedTask(LIKED_TASK_KEY, task_date_range_key, likedTaskData!);
    setFilteredLikedTasks(
      likedTaskData?.filter((likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name))
    );
  };

  const liked_tasks = has_liked_task ? getLocalStorage(LIKED_TASK_KEY)[task_date_range_key] ?? [] : [];

  const [filteredLikedTasks, setFilteredLikedTasks] = useState(
    liked_tasks.filter((likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name))
  );
  useEffect(() => {
    const filteredLikedTasks = liked_tasks.filter(
      (likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name)
    );
    setFilteredLikedTasks(filteredLikedTasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const deleteTaskFromLocalStorage = useCallback(() => {
    removeFromLikedTask(LIKED_TASK_KEY, task_date_range_key);
  }, [task_date_range_key]);

  useEffect(() => {
    if (weeklyStatus === "Approved") {
      deleteTaskFromLocalStorage();
    }
  }, [deleteTaskFromLocalStorage, weeklyStatus]);

  return (
    <ErrorFallback>
      {isTaskLogDialogBoxOpen && (
        <TaskLog task={selectedTask} isOpen={isTaskLogDialogBoxOpen} onOpenChange={setIsTaskLogDialogBoxOpen} />
      )}
      <Table>
        <Header
          showHeading={showHeading}
          dates={dates}
          importTasks={importTasks}
          holidayList={holidayList}
          loadingLikedTasks={loadingLikedTasks}
          setTaskInLocalStorage={setTaskInLocalStorage}
        />
        <TableBody>
          <TotalHourRow
            leaves={leaves}
            dates={dates}
            tasks={tasks}
            holidays={holidays}
            workingHour={workingHour}
            workingFrequency={workingFrequency}
          />
          <LeaveRow
            dates={dates}
            holidayList={holidayList}
            leaves={leaves}
            expectedHours={expectatedHours(workingHour, workingFrequency)}
          />

          {weeklyStatus != "Approved" && (
            <EmptyRow
              dates={dates}
              holidayList={holidayList}
              onCellClick={onCellClick}
              setSelectedTask={setSelectedTask}
              disabled={disabled}
              setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
              likedTaskData={likedTaskData!}
              getLikedTaskData={getLikedTaskData}
            />
          )}
          {weeklyStatus != "Approved" &&
            filteredLikedTasks.length > 0 &&
            importTasks &&
            filteredLikedTasks.map((task: TaskDataProps) => {
              return (
                <EmptyRow
                  key={task.name}
                  dates={dates}
                  holidayList={holidayList}
                  onCellClick={onCellClick}
                  setSelectedTask={setSelectedTask}
                  disabled={disabled}
                  setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
                  name={task.name}
                  taskData={task}
                  likedTaskData={likedTaskData}
                  getLikedTaskData={getLikedTaskData}
                />
              );
            })}
          <Row
            dates={dates}
            tasks={tasks}
            holidayList={holidayList}
            onCellClick={onCellClick}
            disabled={disabled}
            likedTaskData={likedTaskData}
            getLikedTaskData={getLikedTaskData}
            setSelectedTask={setSelectedTask}
            setIsTaskLogDialogBoxOpen={setIsTaskLogDialogBoxOpen}
            workingFrequency={workingFrequency}
            workingHour={workingHour}
            hideLikeButton={hideLikeButton}
          />
        </TableBody>
      </Table>
    </ErrorFallback>
  );
};
