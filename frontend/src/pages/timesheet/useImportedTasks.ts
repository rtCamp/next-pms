import { computed, ref, toValue, watch, type MaybeRefOrGetter } from "vue";
import { IMPORTED_TASKS_STORAGE_KEY } from "./constants";
import type { LikedTask } from "./types";

/** Imported tasks by week start date (`YYYY-MM-DD`), the React app's stored format. */
type ImportedTasksStore = Record<string, LikedTask[]>;

function readStore(): ImportedTasksStore {
  const value = localStorage.getItem(IMPORTED_TASKS_STORAGE_KEY);
  if (!value) return {};
  try {
    return JSON.parse(value) as ImportedTasksStore;
  } catch {
    return {};
  }
}

function writeStore(store: ImportedTasksStore) {
  localStorage.setItem(IMPORTED_TASKS_STORAGE_KEY, JSON.stringify(store));
}

/**
 * The liked tasks imported into one week, kept in localStorage so they stay listed
 * (without entries) until cleared.
 */
export function useImportedTasks(weekStartDate: MaybeRefOrGetter<string>) {
  const importedTasks = ref<LikedTask[]>([]);

  watch(
    () => toValue(weekStartDate),
    (week) => (importedTasks.value = readStore()[week] ?? []),
    { immediate: true },
  );

  function importLikedTasks(tasks: LikedTask[]) {
    writeStore({ ...readStore(), [toValue(weekStartDate)]: tasks });
    importedTasks.value = tasks;
  }

  function clearImportedTasks() {
    const store = readStore();
    delete store[toValue(weekStartDate)];
    writeStore(store);
    importedTasks.value = [];
  }

  return {
    importedTasks,
    isWeekImported: computed(() => importedTasks.value.length > 0),
    importLikedTasks,
    clearImportedTasks,
  };
}
