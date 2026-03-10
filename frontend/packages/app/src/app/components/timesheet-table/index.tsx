/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from "react";
import { TotalRow, TimeOffRow, ProjectRow, TaskRow } from "@next-pms/design-system/components";
import { ErrorFallback, Accordion, AccordionItem, AccordionContent } from "@next-pms/design-system/components";
/**
 * Internal dependencies
 */
import { LIKED_TASK_KEY } from "@/lib/constant";
import { hasKeyInLocalStorage, getLocalStorage, removeFromLikedTask, setLikedTask } from "@/lib/storage";
import { expectatedHours, getHolidayList } from "@/lib/utils";
import type { timesheetTableProps } from "./components/types";
import { HeaderRow } from "./components/row/headerRow";
import { WeekRow } from "./components/row/weekRow";

const MOCK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MOCK_DATES = ["Mar 3", "Mar 4", "Mar 5", "Mar 6", "Mar 7", "Mar 8", "Mar 9"];
const MOCK_TODAY = "Mar 9";

const MOCK_PROJECTS = [
  {
    key: "proj-1",
    label: "Website Redesign",
    timeEntries: ["04:00", "04:00", "04:00", "03:00", "03:00", "", ""],
    totalHours: "18:00",
    tasks: [
      {
        key: "task-1",
        label: "Design Homepage",
        status: "working" as const,
        starred: true,
        totalHours: "10:00",
        timeEntries: [
          { time: "02:00" },
          { time: "02:00", nonBillable: true },
          { time: "02:00" },
          { time: "02:00" },
          { time: "02:00" },
          { time: "" },
          { time: "" },
        ],
      },
      {
        key: "task-2",
        label: "Develop Navigation",
        status: "pending-rev" as const,
        starred: false,
        totalHours: "08:00",
        timeEntries: [
          { time: "02:00" },
          { time: "02:00" },
          { time: "02:00" },
          { time: "01:00" },
          { time: "01:00" },
          { time: "" },
          { time: "" },
        ],
      },
    ],
  },
  {
    key: "proj-2",
    label: "Mobile App Development",
    timeEntries: ["04:00", "03:30", "04:00", "04:00", "03:00", "", ""],
    totalHours: "18:30",
    tasks: [
      {
        key: "task-3",
        label: "Setup React Native",
        status: "open" as const,
        starred: false,
        totalHours: "10:30",
        timeEntries: [
          { time: "02:00" },
          { time: "01:30" },
          { time: "02:00" },
          { time: "02:00" },
          { time: "03:00" },
          { time: "" },
          { time: "" },
        ],
      },
      {
        key: "task-4",
        label: "Build Auth Flow",
        status: "overdue" as const,
        starred: false,
        totalHours: "08:00",
        timeEntries: [
          { time: "02:00" },
          { time: "02:00" },
          { time: "02:00" },
          { time: "02:00" },
          { time: "" },
          { time: "" },
          { time: "" },
        ],
      },
    ],
  },
];

const MOCK_TOTAL_ENTRIES = ["08:00", "07:30", "08:00", "07:00", "06:00", "", ""];
const MOCK_WEEK_TOTAL = "36:30";
const MOCK_TIMEOFF_ENTRIES = ["", "", "", "", "", "08:00", ""];
const MOCK_TIMEOFF_TOTAL = "08:00";

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
  onButtonClick,
  status,
}: timesheetTableProps) => {
  const holidayList = getHolidayList(holidays);
  const [isTaskLogDialogBoxOpen, setIsTaskLogDialogBoxOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const task_date_range_key = dates[0] + "-" + dates[dates.length - 1];
  const has_liked_task = hasKeyInLocalStorage(LIKED_TASK_KEY);

  const setTaskInLocalStorage = () => {
    setLikedTask(LIKED_TASK_KEY, task_date_range_key, likedTaskData!);
    setFilteredLikedTasks(
      likedTaskData?.filter((likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name)),
    );
  };

  const liked_tasks = has_liked_task ? (getLocalStorage(LIKED_TASK_KEY)[task_date_range_key] ?? []) : [];

  const [filteredLikedTasks, setFilteredLikedTasks] = useState(
    liked_tasks.filter((likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name)),
  );
  useEffect(() => {
    const filteredLikedTasks = liked_tasks.filter(
      (likedTask: { name: string }) => !Object.keys(tasks).includes(likedTask.name),
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

  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

  return (
    <ErrorFallback>
      {showHeading && (
        <div className="mb-4">
          <HeaderRow
            dates={dates}
            showHeading={showHeading}
            breadcrumbs={{
              items: [
                { label: "Week", interactive: false },
                { label: "Project", interactive: false },
                { label: "Task", interactive: false },
              ],
              highlightLastItem: false,
              size: "sm",
              crumbClassName: "first:pl-0 last:pr-0",
              className: "pl-[8px]",
            }}
          />
        </div>
      )}
      <WeekRow
        label="This Week"
        dates={dates}
        tasks={tasks}
        leaves={leaves}
        holidays={holidays}
        workingHour={workingHour}
        workingFrequency={workingFrequency}
        status={status}
        className="pl-3"
        onButtonClick={onButtonClick}
      >
        <TotalRow
          breadcrumbs={{
            items: [{ label: "Projects" }, { label: "Tasks" }],
            size: "md",
            highlightAllItems: true,
            crumbClassName: "first:pl-0 last:pr-0",
          }}
          totalTimeEntries={MOCK_TOTAL_ENTRIES}
          totalHours={MOCK_WEEK_TOTAL}
          status="approved"
          className="pl-[30px]"
          starred={true}
        />

        {MOCK_PROJECTS.map((project) => {
          const isProjectCollapsed = collapsedProjects[project.key] ?? false;
          return (
            <Accordion
              key={project.key}
              value={isProjectCollapsed ? [] : ["project"]}
              onValueChange={(v) =>
                setCollapsedProjects((prev) => ({ ...prev, [project.key]: !v.includes("project") }))
              }
            >
              <AccordionItem value="project" className="border-none">
                <ProjectRow
                  label={project.label}
                  timeEntries={project.timeEntries}
                  totalHours={project.totalHours}
                  status="approved"
                  collapsed={isProjectCollapsed}
                  onToggle={() => setCollapsedProjects((prev) => ({ ...prev, [project.key]: !prev[project.key] }))}
                  className="pl-[30px]"
                />
                <AccordionContent className="pb-0">
                  {project.tasks.map((task) => (
                    <TaskRow
                      key={task.key}
                      label={task.label}
                      timeEntries={task.timeEntries}
                      totalHours={task.totalHours}
                      status={task.status}
                      starred={task.starred}
                      onCellClick={() => {}}
                      className="pl-[54px]"
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        })}

        <TimeOffRow
          label="Time-off"
          timeOffEntries={MOCK_TIMEOFF_ENTRIES}
          totalHours={MOCK_TIMEOFF_TOTAL}
          className="pl-[30px]"
        />
      </WeekRow>
    </ErrorFallback>
  );
};
