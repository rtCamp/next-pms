import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { TaskDataProps } from "@/types/timesheet";

const STORAGE_KEY = "next-pms:importedTasks";

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

// Module-level cache to maintain stable references
let cachedValue: ImportedTasksStore = {};
let cachedRawValue: string | null = null;

const getStorageValue = (): ImportedTasksStore => {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    // Only parse and update cache if the raw value changed
    if (rawValue !== cachedRawValue) {
      cachedRawValue = rawValue;
      cachedValue = rawValue ? JSON.parse(rawValue) : {};
    }
    return cachedValue;
  } catch {
    return cachedValue;
  }
};

const setStorageValue = (value: ImportedTasksStore): void => {
  try {
    const rawValue = JSON.stringify(value);
    localStorage.setItem(STORAGE_KEY, rawValue);
    // Update cache immediately
    cachedRawValue = rawValue;
    cachedValue = value;
    // Dispatch storage event to notify subscribers
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  } catch {
    // Silently fail if localStorage is not available
  }
};

const subscribe = (callback: () => void): (() => void) => {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      callback();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
};

/**
 * Hook to manage imported liked tasks in localStorage on a per-week basis.
 *
 * @param weekStartDate - The start date of the week in "YYYY-MM-DD" format
 * @returns Object with imported task IDs and methods to import/clear tasks
 */
export const useImportedTasks = (
  weekStartDate: string,
): UseImportedTasksReturn => {
  const store = useSyncExternalStore(subscribe, getStorageValue);

  const importedTasks = useMemo(() => {
    return store[weekStartDate] ?? [];
  }, [store, weekStartDate]);

  const isWeekImported = useMemo(() => {
    return importedTasks.length > 0;
  }, [importedTasks]);

  const importLikedTasks = useCallback(
    (tasks: TaskDataProps[]) => {
      const current = getStorageValue();
      setStorageValue({
        ...current,
        [weekStartDate]: tasks,
      });
    },
    [weekStartDate],
  );

  const clearImportedTasks = useCallback(() => {
    const current = getStorageValue();
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { [weekStartDate]: _, ...rest } = current;
    setStorageValue(rest);
  }, [weekStartDate]);

  return {
    importedTasks,
    isWeekImported,
    importLikedTasks,
    clearImportedTasks,
  };
};
