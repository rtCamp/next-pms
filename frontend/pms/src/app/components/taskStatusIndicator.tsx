import { cn } from "@/lib/utils";

interface TaskIndicatorProps {
  className?: string;
  expectedTime: number;
  actualTime: number;
  status: string;
}

const TaskStatusIndicator = ({ className, expectedTime, actualTime,status }: TaskIndicatorProps) => {
  // http://localhost/api/method/next_pms.timesheet.api.task.get_task_list?search=TASK-2024-14811
  // console.log(expectedTime, actualTime);

  let color: string;

  if (status === "Completed") {
    color = "bg-gray-300";
  } else if (expectedTime === 0) {
    color = "bg-orange-400";
  } else if (Number(actualTime) <= Number(expectedTime)) {
    color = "bg-green-600";
  } else {
    color = "bg-destructive";
  }
  return <div className={cn("w-2 h-2 rounded-full my-2", color, className)} />;
};

export default TaskStatusIndicator;
