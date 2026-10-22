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
import {
  useDoctypeListUpdates,
  type ListUpdate,
} from "@/composables/useDoctypeListUpdates";
import { useSession } from "@/session";
import { errorMessage } from "@/utils/errors";
import { OWN_WRITE_ECHO_MS, TODO_LIMIT } from "./constants";
import {
  assigneeIds,
  deleteTodoMessage,
  hasTodoCustomFields,
  todoFields,
  toTodoFields,
  withAssignees,
} from "./todos";
import type { Todo, TodoDoc, TodoForm, TodoStatus, TodoUser } from "./types";

function createTodos(projectId: MaybeRefOrGetter<string>) {
  const session = useSession();
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

  // A local write already refetches (useList's `refetch`), so its realtime echo is
  // skipped: any event during the write, and this user's first event for that ToDo
  // after it. The event names no project, so any other ToDo change refetches.
  let writesInFlight = 0;
  let missedUpdate = false;
  const ownWrites = new Map<string, number>();

  async function localWrite<T>(
    write: () => Promise<T>,
    nameOf: (result: T) => string | undefined,
  ): Promise<T> {
    writesInFlight++;
    try {
      const result = await write();
      const name = nameOf(result);
      if (name) ownWrites.set(name, Date.now() + OWN_WRITE_ECHO_MS);
      return result;
    } catch (error) {
      if (missedUpdate) refresh();
      throw error;
    } finally {
      if (--writesInFlight === 0) missedUpdate = false;
    }
  }

  function isOwnEcho({ name, user }: ListUpdate) {
    if (writesInFlight) {
      missedUpdate = true;
      return true;
    }
    if (!name || user !== session.userId) return false;
    const until = ownWrites.get(name);
    ownWrites.delete(name);
    return until !== undefined && Date.now() <= until;
  }

  useDoctypeListUpdates("ToDo", (update) => {
    if (!isOwnEcho(update)) refresh();
  });

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
      await localWrite(
        () => list.setValue.submit({ name: todo.name, status }),
        () => todo.name,
      );
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
          await localWrite(
            () => list.delete.submit({ name: todo.name }),
            () => todo.name,
          );
        } catch (error) {
          // Thrown, the message shows in the dialog and keeps it open.
          throw new Error(errorMessage(error));
        }
        toast.success("ToDo deleted");
      },
    });
  }

  /** The ToDo being edited, `null` when creating; the dialog is open while `editorOpen`. */
  const editing = ref<Todo | null>(null);
  const editorOpen = ref(false);
  const saving = ref(false);

  function openCreate() {
    editing.value = null;
    editorOpen.value = true;
  }

  function openEdit(todo: Todo) {
    editing.value = todo;
    editorOpen.value = true;
  }

  /** Creates or updates the ToDo; resolves `true` when it saved. */
  async function save(form: TodoForm): Promise<boolean> {
    if (saving.value) return false;
    const fields = toTodoFields(form, customFields);
    const todo = editing.value;
    saving.value = true;
    try {
      if (todo) {
        await localWrite(
          () => list.setValue.submit({ name: todo.name, ...fields }),
          () => todo.name,
        );
      } else {
        await localWrite(
          () =>
            list.insert.submit({
              ...fields,
              assigned_by: session.userId,
              reference_type: "Project",
              reference_name: toValue(projectId),
            } as Partial<TodoDoc>),
          (created) => created?.name,
        );
      }
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    } finally {
      saving.value = false;
    }
    toast.success(todo ? "ToDo updated" : "ToDo created");
    return true;
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
    editing,
    editorOpen,
    saving,
    openCreate,
    openEdit,
    save,
  };
}

export type Todos = ReturnType<typeof createTodos>;

const todosKey: InjectionKey<Todos> = Symbol("todos");

/**
 * The project's ToDos, shared by every part of the Project details page that shows
 * them: the list (loaded on first `load()`, refetched on realtime ToDo changes), the
 * one create / edit dialog, done / reopen and delete.
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
