import { useCallback, useState } from "react";
import { IMPORTED_TASKS_STORAGE_KEY as STORAGE_KEY } from "@/lib/constant";
import { getLocalStorage, setLocalStorage } from "@/lib/storage";
import type { TaskDataProps } from "@/types/timesheet";

type ImportedTasksStore = Record<string, TaskDataProps[]>;

interface UseImportedTasksReturn {
  /** Array of task objects imported for this week */
  importedTasks: TaskDataProps[];
  /** Whether the week has imported tasks (for star visual state) */
  isWeekImported: boolean;
  /** Import liked tasks to this week's localStorage */
  importLikedTasks: (tasks: TaskDataProps[]) => void;
  /** Clear all imported tasks for this week */
  clearImportedTasks: () => void;
}

/**
 * Hook to manage imported liked tasks in localStorage on a per-week basis.
 *
 * @param weekStartDate - The start date of the week in "YYYY-MM-DD" format
 * @returns Object with imported tasks and methods to import/clear tasks
 */
export const useImportedTasks = (
  weekStartDate: string,
): UseImportedTasksReturn => {
  const [importedTasks, setImportedTasks] = useState<TaskDataProps[]>(() => {
    const store = getLocalStorage<ImportedTasksStore>(STORAGE_KEY, {});
    return store[weekStartDate] ?? [];
  });

  const isWeekImported = importedTasks.length > 0;

  const importLikedTasks = useCallback(
    (tasks: TaskDataProps[]) => {
      const current = getLocalStorage<ImportedTasksStore>(STORAGE_KEY, {});
      setLocalStorage(STORAGE_KEY, {
        ...current,
        [weekStartDate]: tasks,
      });
      setImportedTasks(tasks);
    },
    [weekStartDate],
  );

  const clearImportedTasks = useCallback(() => {
    const current = getLocalStorage<ImportedTasksStore>(STORAGE_KEY, {});
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [weekStartDate]: _, ...rest } = current;
    setLocalStorage(STORAGE_KEY, rest);
    setImportedTasks([]);
  }, [weekStartDate]);

  return {
    importedTasks,
    isWeekImported,
    importLikedTasks,
    clearImportedTasks,
  };
};
