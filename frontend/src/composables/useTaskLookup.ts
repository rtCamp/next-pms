import { computed, reactive, toValue, type MaybeRefOrGetter } from "vue";
import { useRemoteLookup, type LookupOption } from "./useRemoteLookup";

interface TaskItem {
  name: string;
  subject: string;
  project: string;
  project_name: string;
  status: string;
}

/** A task option, with the project it belongs to. */
export interface TaskLookupOption extends LookupOption {
  projectId: string;
  projectName: string;
  status?: string;
}

export interface TaskLookupOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  query: MaybeRefOrGetter<string>;
  /** Only tasks of this project, when set. */
  projectId?: MaybeRefOrGetter<string | undefined>;
  selected?: MaybeRefOrGetter<TaskLookupOption | null | undefined>;
}

/**
 * Searches tasks with `get_task_list`, the ones the user logged time on recently
 * first, optionally within one project.
 */
export function useTaskLookup(options: TaskLookupOptions) {
  const lookup = useRemoteLookup<{ task: TaskItem[] } | null, TaskItem>({
    method: "next_pms.timesheet.api.task.get_task_list",
    enabled: options.enabled,
    query: options.query,
    selected: options.selected,
    refetchOn: () => toValue(options.projectId),
    params: (query) => {
      const projectId = toValue(options.projectId);
      return {
        filter_recent: 1,
        page_length: 20,
        start: 0,
        projects: projectId ? JSON.stringify([projectId]) : undefined,
        search: query || undefined,
      };
    },
    getItems: (response) => response?.task ?? [],
    toOption: (task): TaskLookupOption => ({
      label: task.subject,
      value: task.name,
      projectId: task.project,
      projectName: task.project_name,
      status: task.status,
    }),
  });

  return reactive({
    // toOption builds every option, and `selected` is one, so all are task options.
    options: computed(() => lookup.options as TaskLookupOption[]),
    loading: computed(() => lookup.loading),
    error: computed(() => lookup.error),
  });
}
