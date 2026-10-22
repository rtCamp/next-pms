import {
  computed,
  inject,
  provide,
  reactive,
  ref,
  toValue,
  watch,
  type InjectionKey,
  type MaybeRefOrGetter,
} from "vue";
import { dialog, toast, useList } from "frappe-ui";
import { useDoctypeListUpdates } from "@/composables/useDoctypeListUpdates";
import { errorMessage } from "@/utils/errors";
import { TODO_LIMIT } from "./constants";
import {
  assigneeIds,
  deleteTodoMessage,
  hasTodoCustomFields,
  todoFields,
  withAssignees,
} from "./todos";
import type { Todo, TodoDoc, TodoStatus, TodoUser } from "./types";

function createTodos(projectId: MaybeRefOrGetter<string>) {
  const customFields = hasTodoCustomFields();

  // Loaded by the first tab that shows the ToDos, not with the page.
  const list = useList<TodoDoc>({
    doctype: "ToDo",
    fields: todoFields(customFields),
    filters: () => ({
      reference_type: "Project",
      reference_name: toValue(projectId),
    }),
    orderBy: "creation desc",
    limit: TODO_LIMIT,
    immediate: false,
    onError: (error) => {
      if (list.data) toast.error(errorMessage(error));
    },
  });
  const loaded = ref(false);

  const assignees = computed(() => assigneeIds(list.data ?? []));
  const users = useList<TodoUser>({
    doctype: "User",
    fields: ["name", "full_name", "user_image"],
    filters: () => ({ name: ["in", assignees.value] }),
    limit: TODO_LIMIT,
    immediate: false,
    refetch: false,
  });
  watch(
    () => assignees.value.join(),
    (key) => {
      if (key) users.fetch();
    },
  );

  function load() {
    if (loaded.value) return;
    loaded.value = true;
    list.fetch();
  }

  function refresh() {
    if (loaded.value) list.reload();
  }

  // The event names no project, so any ToDo change refetches.
  useDoctypeListUpdates("ToDo", refresh);

  const todos = computed<Todo[]>(() =>
    withAssignees(list.data ?? [], users.data ?? []),
  );

  /** Status shown while a done / reopen write is in flight. */
  const pendingStatus = reactive(new Map<string, TodoStatus>());

  async function toggleDone(todo: Todo) {
    if (pendingStatus.has(todo.name)) return;
    const status: TodoStatus = todo.status === "Closed" ? "Open" : "Closed";
    pendingStatus.set(todo.name, status);
    try {
      await list.setValue.submit({ name: todo.name, status });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      pendingStatus.delete(todo.name);
    }
  }

  function requestDelete(todo: Todo) {
    dialog.danger({
      title: "Delete ToDo",
      message: deleteTodoMessage(todo),
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await list.delete.submit({ name: todo.name });
        } catch (error) {
          // Thrown, the message shows in the dialog and keeps it open.
          throw new Error(errorMessage(error));
        }
        toast.success("ToDo deleted");
      },
    });
  }

  return {
    customFields,
    todos,
    /** True until a load answers with rows or an error. */
    loading: computed(() => !list.data && !list.error),
    /** A failed load with no rows to show; a failed refetch shows a toast instead. */
    loadError: computed(() => (list.data ? null : list.error)),
    load,
    refresh,
    statusOf: (todo: Todo) => pendingStatus.get(todo.name) ?? todo.status,
    isStatusBusy: (todo: Todo) => pendingStatus.has(todo.name),
    toggleDone,
    requestDelete,
  };
}

export type Todos = ReturnType<typeof createTodos>;

const todosKey: InjectionKey<Todos> = Symbol("todos");

/**
 * The project's ToDos, shared by every part of the Project details page that shows
 * them: the list (loaded on first `load()`, refetched on realtime ToDo changes),
 * done / reopen and delete.
 */
export function provideTodos(projectId: MaybeRefOrGetter<string>): Todos {
  const todos = createTodos(projectId);
  provide(todosKey, todos);
  return todos;
}

/** The ToDos provided by the Project details page this component is on. */
export function useTodos(): Todos {
  const todos = inject(todosKey);
  if (!todos) throw new Error("useTodos() needs provideTodos() in a parent");
  return todos;
}
