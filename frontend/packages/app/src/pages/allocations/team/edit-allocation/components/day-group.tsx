import { mergeClassNames as cn } from "@next-pms/design-system/utils";
import { EditScheduleDay } from "./day";
import type { EditScheduleDayCellData } from "../types";

interface EditScheduleDayGroupProps {
  days: EditScheduleDayCellData[];
  className?: string;
  onDayClick?: (id: string) => void;
}

export function EditScheduleDayGroup({
  days,
  className,
  onDayClick,
}: EditScheduleDayGroupProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-1 overflow-x-auto no-scrollbar",
        className,
      )}
    >
      {days.map((day) => (
        <EditScheduleDay
          key={day.id}
          {...day}
          onClick={(id) => onDayClick?.(id)}
        />
      ))}
    </div>
  );
}
