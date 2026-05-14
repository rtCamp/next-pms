import { useRemoteLookup, type LookupOption } from "@/hooks/useRemoteLookup";

type TaskLookupItem = {
  name: string;
  project: string;
  project_name: string;
  subject: string;
};

type TaskLookupResult = {
  task: TaskLookupItem[];
};

export type TaskLookupOption = LookupOption & {
  projectId: string;
  projectName: string;
};

interface UseTaskLookupOptions {
  /** Controls whether the task lookup should fetch for the current UI state. */
  shouldFetch: boolean;
  /** Prioritizes recently used and liked tasks when the backend supports it. */
  includeLiked?: boolean;
  /** Caps the number of task rows fetched per request. */
  pageSize?: number;
  /** Restricts tasks to a single selected project when provided. */
  projectId?: string;
  /** Filters tasks by the backend search parameter. */
  query: string;
  /** Keeps the current selection visible when it is not in the latest results. */
  selectedOption?: TaskLookupOption | null;
}

/**
 * Fetches task combobox options with optional project scoping and recent-task ordering.
 */
export const useTaskLookup = ({
  shouldFetch,
  includeLiked = true,
  pageSize = 20,
  projectId,
  query,
  selectedOption,
}: UseTaskLookupOptions) => {
  return useRemoteLookup<TaskLookupResult, TaskLookupItem, TaskLookupOption>({
    shouldFetch,
    query,
    pageSize,
    method: "next_pms.timesheet.api.task.get_task_list",
    params: ({ query: searchQuery, pageSize }) => ({
      filter_recent: includeLiked,
      page_length: pageSize,
      projects: projectId ? [projectId] : undefined,
      search: searchQuery || undefined,
      start: 0,
    }),
    getItems: (message) => message?.task ?? [],
    mapOption: (task) => ({
      label: task.subject,
      value: task.name,
      projectId: task.project,
      projectName: task.project_name,
    }),
    selectedOption,
  });
};
