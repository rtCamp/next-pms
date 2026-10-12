<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { Button, dayjs, dialog, Dropdown, Spinner } from "frappe-ui";
import {
  List,
  ListCell,
  ListHeader,
  ListHeaderCell,
  ListHeaderCellSort,
  ListRow,
  ListRows,
} from "frappe-ui/list";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { TaskStatus, type TaskStatusValue } from "@/components/TaskStatus";
import { useSession } from "@/session";
import { formatHours } from "@/utils/format";
import LikeCell from "./cells/LikeCell.vue";
import SubjectCell from "./cells/SubjectCell.vue";
import { TASK_PRIORITIES, TASK_SORTABLE_FIELDS } from "./constants";
import type { TaskListItem, TaskPriority } from "./types";
import { useTaskColumns } from "./useTaskColumns";
import { useTaskFilters } from "./useTaskFilters";
import { useTaskList } from "./useTaskList";

const emit = defineEmits<{
  openTask: [name: string];
  editTask: [task: TaskListItem];
}>();

/** Roles that may delete any task; others may delete only their own. */
const MANAGER_ROLES = ["Projects Manager", "Delivery Manager", "Delivery User"];

const SORT_FIELD_BY_COLUMN = new Map<string, string>(
  TASK_SORTABLE_FIELDS.map(({ column, field }) => [column, field]),
);

const taskList = useTaskList();
const session = useSession();
const { columns } = useTaskColumns();
const { sort, setSort } = useTaskFilters();

const columnWidths = computed(() =>
  columns.value.map((column) => column.width),
);

function sortDirection(column: string) {
  const field = SORT_FIELD_BY_COLUMN.get(column);
  return field && sort.value.field === field ? sort.value.order : null;
}

// Same field flips the order; a new field starts descending, as in the React page.
function sortBy(column: string) {
  const field = SORT_FIELD_BY_COLUMN.get(column);
  if (!field) return;
  const order =
    sort.value.field === field && sort.value.order === "desc" ? "asc" : "desc";
  setSort({ field, order });
}

function emptyAsNA(value: string | null | undefined) {
  return value ? value : "N/A";
}

function priorityLabel(priority: string) {
  return TASK_PRIORITIES.includes(priority as TaskPriority) ? priority : "N/A";
}

function formatDueDate(date: string | null) {
  return date ? dayjs(date).format("MMM D, YYYY") : null;
}

function canDelete(task: TaskListItem) {
  return session.hasAnyRole(MANAGER_ROLES) || task.owner === session.userId;
}

function confirmDelete(task: TaskListItem) {
  dialog.danger({
    title: "Delete task",
    message:
      "Are you sure you want to delete this task? This action cannot be undone.",
    onConfirm: () => taskList.deleteTask(task.name),
  });
}

function rowActions(task: TaskListItem) {
  const edit = { label: "Edit", onClick: () => emit("editTask", task) };
  if (!canDelete(task)) return [edit];
  return [
    edit,
    {
      label: "Delete",
      theme: "red" as const,
      onClick: () => confirmDelete(task),
    },
  ];
}

// Infinite scroll: load the next page while the sentinel under the rows is within
// 200px of the bottom of the rows' scroll area. The observer only reports changes,
// so after each page the sentinel is observed afresh: a page shorter than the area
// leaves it visible, and the next callback, measured against the new rows, says
// whether another page is needed.
const scroller = useTemplateRef("scroller");
const sentinel = useTemplateRef("sentinel");
const sentinelVisible = ref(false);
let observer: IntersectionObserver | undefined;

function observeSentinel() {
  if (!observer || observer.root !== scroller.value) {
    observer?.disconnect();
    observer = new IntersectionObserver(
      ([entry]) => (sentinelVisible.value = Boolean(entry?.isIntersecting)),
      { root: scroller.value, rootMargin: "200px" },
    );
  }
  observer.disconnect();
  sentinelVisible.value = false;
  if (sentinel.value) observer.observe(sentinel.value);
}

onMounted(observeSentinel);
onBeforeUnmount(() => observer?.disconnect());

watch(sentinel, observeSentinel);
// Synchronous, so the stale "visible" is gone before the watcher below sees loading end.
watch(
  () => taskList.rows.length,
  () => {
    sentinelVisible.value = false;
    nextTick(observeSentinel);
  },
  { flush: "sync" },
);
watch(
  () => [sentinelVisible.value, taskList.isLoading, taskList.hasMore] as const,
  ([visible, loading, hasMore]) => {
    if (visible && !loading && hasMore) taskList.loadMore();
  },
);
</script>

<template>
  <div
    v-if="taskList.isInitialLoad"
    class="flex h-64 items-center justify-center"
  >
    <Spinner class="size-6" />
  </div>
  <LoadingOverlay v-else :active="taskList.isFilterRequest">
    <!-- As in the React list: the header stays put and only the rows scroll; both
         scroll sideways together when the columns are wider than the page. -->
    <div class="flex min-h-0 flex-1 flex-col overflow-x-auto px-5">
      <!-- Spacing from the React list: 8px row inset; rows and header step by 41px and
           45px because React's 1px dividers take up space. -->
      <List
        :columns="columnWidths"
        :row-height="41"
        aria-label="Tasks"
        class="flex min-h-0 w-max min-w-full flex-1 flex-col list-row-px-2"
      >
        <ListHeader class="!h-[45px]">
          <template v-for="column in columns" :key="column.key">
            <ListHeaderCellSort
              v-if="SORT_FIELD_BY_COLUMN.has(column.key)"
              :direction="sortDirection(column.key)"
              @click="sortBy(column.key)"
            >
              {{ column.label }}
            </ListHeaderCellSort>
            <ListHeaderCell v-else>
              <span class="sr-only">{{
                column.key === "like" ? "Star" : "Actions"
              }}</span>
            </ListHeaderCell>
          </template>
        </ListHeader>

        <div ref="scroller" class="min-h-0 flex-1 overflow-y-auto">
          <p
            v-if="!taskList.isFilterRequest && taskList.rows.length === 0"
            class="py-6 text-center text-base text-ink-gray-5"
          >
            No tasks found.
          </p>
          <ListRows v-else v-slot="{ item }" :items="taskList.rows">
            <ListRow>
              <ListCell
                v-for="column in columns"
                :key="column.key"
                class="min-w-0"
              >
                <SubjectCell
                  v-if="column.key === 'subject'"
                  :subject="item.subject"
                  @open="emit('openTask', item.name)"
                />
                <span
                  v-else-if="column.key === 'project_name'"
                  class="block truncate text-base text-ink-gray-6"
                >
                  {{ emptyAsNA(item.project_name) }}
                </span>
                <div
                  v-else-if="column.key === 'status'"
                  class="flex min-w-0 items-center gap-2 text-base text-ink-gray-6"
                >
                  <TaskStatus
                    :status="item.status as TaskStatusValue"
                    variant="icon"
                  />
                  <span class="truncate">{{ item.status }}</span>
                </div>
                <span
                  v-else-if="column.key === 'expected_time'"
                  class="block truncate text-base text-ink-gray-6"
                >
                  {{ formatHours(item.expected_time) }}
                </span>
                <span
                  v-else-if="column.key === 'priority'"
                  class="block truncate text-base text-ink-gray-6"
                >
                  {{ priorityLabel(item.priority) }}
                </span>
                <template v-else-if="column.key === 'exp_end_date'">
                  <span
                    v-if="formatDueDate(item.exp_end_date)"
                    class="inline-flex min-w-0 items-center gap-1.5 text-base text-ink-gray-6"
                  >
                    <span
                      class="lucide-calendar-clock size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span class="truncate">{{
                      formatDueDate(item.exp_end_date)
                    }}</span>
                  </span>
                  <span v-else class="block text-base text-ink-gray-6">
                    N/A
                  </span>
                </template>
                <LikeCell
                  v-else-if="column.key === 'like'"
                  :name="item.name"
                  :liked-by="item._liked_by"
                  @toggled="taskList.refresh()"
                />
                <Dropdown
                  v-else-if="column.key === 'actions'"
                  :options="rowActions(item)"
                  align="center"
                >
                  <Button
                    variant="ghost"
                    icon="lucide-ellipsis"
                    aria-label="Task actions"
                  />
                </Dropdown>
              </ListCell>
            </ListRow>
          </ListRows>
          <div ref="sentinel" aria-hidden="true" />
          <div
            v-if="taskList.isNextPageLoading"
            class="flex justify-center py-3"
          >
            <Spinner class="size-4" />
          </div>
        </div>
      </List>
    </div>
  </LoadingOverlay>
</template>
