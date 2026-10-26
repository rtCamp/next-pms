import {
  computed,
  inject,
  onScopeDispose,
  provide,
  reactive,
  ref,
  toValue,
  watch,
  type InjectionKey,
  type MaybeRefOrGetter,
} from "vue";
import { dialog, toast, useCall } from "frappe-ui";
import { useDoctypeListUpdates } from "@/composables/useDoctypeListUpdates";
import { createOwnWrites } from "@/pages/project-details/ownWrites";
import { useSession } from "@/session";
import { errorMessage, isAbortError } from "@/utils/errors";
import { TODO_API } from "./constants";
import {
  deleteTodoMessage,
  hasTodoCustomFields,
  isSameRecord,
  linkKey,
  todosByRecord,
  toTodo,
  toTodoFields,
  unlinkTodoMessage,
} from "./todos";
import type {
  LinkedRecord,
  ProjectTodoRow,
  RecordRef,
  Todo,
  TodoDoc,
  TodoForm,
  TodoStatus,
} from "./types";

/** Runs a write that saves a record, remembering the record `nameOf` names in its result. */
type RecordWriteTracker = <T>(
  write: () => Promise<T>,
  nameOf: (result: T) => string | undefined,
) => Promise<T>;

function createTodos(projectId: MaybeRefOrGetter<string>) {
  const session = useSession();
  const customFields = hasTodoCustomFields();

  const project = () => ({ project: toValue(projectId) });
  // Loaded by the first tab that shows the ToDos, not with the page. Everyone who can
  // open the project gets its ToDos, each with its assignee and linked record.
  const list = useCall<ProjectTodoRow[], { project: string }>({
    url: `${TODO_API}.get_project_todos`,
    params: project,
    immediate: false,
    onError: (error) => {
      if (list.data && !isAbortError(error)) toast.error(errorMessage(error));
    },
  });
  const loaded = ref(false);

  const linkable = useCall<LinkedRecord[], { project: string }>({
    url: `${TODO_API}.get_linkable_records`,
    params: project,
    immediate: false,
  });
  let linkableLoaded = false;

  // Separate calls: a newer submit aborts the one in flight on the same call.
  const create = useCall<TodoDoc, { project: string; todo: Partial<TodoDoc> }>({
    url: `${TODO_API}.create_project_todo`,
    method: "POST",
    immediate: false,
  });
  const updateCall = () =>
    useCall<TodoDoc, { todo: string; values: Partial<TodoDoc> }>({
      url: `${TODO_API}.update_project_todo`,
      method: "POST",
      immediate: false,
    });
  const update = updateCall();
  const statusUpdate = updateCall();
  const remove = useCall<unknown, { todo: string }>({
    url: `${TODO_API}.delete_project_todo`,
    method: "POST",
    immediate: false,
  });
  // Done / reopen on several rows go one at a time, as they share a call.
  let statusQueue: Promise<unknown> = Promise.resolve();
  function setStatus(todo: string, status: TodoStatus) {
    const write = statusQueue.then(() =>
      statusUpdate.submit({ todo, values: { status } }),
    );
    statusQueue = write.then(
      () => undefined,
      () => undefined,
    );
    return write;
  }

  const createLinked = useCall<
    TodoDoc,
    { doctype: string; name: string; todo: Partial<TodoDoc> }
  >({
    url: `${TODO_API}.create_linked_todo`,
    method: "POST",
    immediate: false,
  });
  const link = useCall<
    unknown,
    { todo: string; doctype: string; name: string }
  >({ url: `${TODO_API}.link_todo`, method: "POST", immediate: false });
  const unlink = useCall<unknown, { todo: string }>({
    url: `${TODO_API}.unlink_todo`,
    method: "POST",
    immediate: false,
  });

  function load() {
    if (loaded.value) return;
    loaded.value = true;
    list.fetch();
  }

  /** Loads the records the user may link ToDos to, once; `refreshLinks()` reloads them. */
  function loadLinkable() {
    if (linkableLoaded) return;
    linkableLoaded = true;
    linkable.fetch();
  }

  function refresh() {
    if (loaded.value) list.reload();
  }

  /** Reloads which ToDos are linked where, and what may be linked, after a linked record changed. */
  function refreshLinks() {
    refresh();
    if (linkableLoaded) linkable.reload();
  }

  function canLink(record: RecordRef | null | undefined): boolean {
    return (linkable.data ?? []).some((option) => isSameRecord(option, record));
  }

  const recordWriteTrackers = new Map<string, RecordWriteTracker>();

  /**
   * Lets the part of the page that shows `doctype`'s records tell the link writes that
   * save one of them (linking, unlinking, creating a linked ToDo) from others' changes.
   */
  function trackRecordWrites(doctype: string, track: RecordWriteTracker) {
    recordWriteTrackers.set(doctype, track);
    onScopeDispose(() => {
      if (recordWriteTrackers.get(doctype) === track)
        recordWriteTrackers.delete(doctype);
    });
  }

  /** Runs `write`, which saves each of `records`, through their doctypes' trackers. */
  function writeRecords<T>(
    records: (RecordRef | null | undefined)[],
    write: () => Promise<T>,
  ): Promise<T> {
    const run = records.reduce<() => Promise<T>>((inner, record) => {
      const track = record && recordWriteTrackers.get(record.doctype);
      return track ? () => track(inner, () => record.name) : inner;
    }, write);
    return run();
  }

  // The event names no project, so any other ToDo change refetches.
  const { localWrite, isOwnEcho } = createOwnWrites({
    userId: () => session.userId,
    onMissedUpdate: refresh,
  });

  useDoctypeListUpdates("ToDo", (update) => {
    if (!isOwnEcho(update)) refresh();
  });

  const todos = computed<Todo[]>(() => (list.data ?? []).map(toTodo));

  const byRecord = computed(() => todosByRecord(todos.value));

  /** The ToDos linked to `record`. */
  function linkedTo(record: RecordRef | null | undefined): Todo[] {
    return (record && byRecord.value.get(linkKey(record))) || [];
  }

  /** Status shown while a done / reopen write is in flight. */
  const pendingStatus = reactive(new Map<string, TodoStatus>());

  async function toggleDone(todo: Todo) {
    if (pendingStatus.has(todo.name)) return;
    const status: TodoStatus = todo.status === "Closed" ? "Open" : "Closed";
    pendingStatus.set(todo.name, status);
    try {
      await localWrite(
        () => setStatus(todo.name, status),
        () => todo.name,
      );
      // Shows the new status until the list has it.
      await list.reload();
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
            () => remove.submit({ todo: todo.name }),
            () => todo.name,
          );
        } catch (error) {
          // Thrown, the message shows in the dialog and keeps it open.
          throw new Error(errorMessage(error));
        }
        toast.success("ToDo deleted");
        if (todo.linked) refreshLinks();
        else refresh();
      },
    });
  }

  function requestUnlink(todo: Todo) {
    const record = todo.linked;
    if (!record) return;
    dialog.danger({
      title: "Unlink ToDo",
      message: unlinkTodoMessage(todo, record),
      confirmLabel: "Unlink",
      onConfirm: async () => {
        try {
          await writeRecords([record], () =>
            unlink.submit({ todo: todo.name }),
          );
        } catch (error) {
          throw new Error(errorMessage(error));
        }
        toast.success("ToDo unlinked");
        refreshLinks();
      },
    });
  }

  /** The ToDo being edited, `null` when creating; the dialog is open while `editorOpen`. */
  const editing = ref<Todo | null>(null);
  /** The record a new ToDo is linked to, preset when created from that record. */
  const createLinkedTo = ref<LinkedRecord | null>(null);
  const editorOpen = ref(false);
  const saving = ref(false);

  watch(editorOpen, (open) => {
    if (!open) return;
    linkableLoaded = true;
    linkable.reload();
  });

  function openCreate(linkedTo?: LinkedRecord) {
    editing.value = null;
    createLinkedTo.value = linkedTo ?? null;
    editorOpen.value = true;
  }

  function openEdit(todo: Todo) {
    editing.value = todo;
    createLinkedTo.value = null;
    editorOpen.value = true;
  }

  async function updateLink(todo: Todo, record: LinkedRecord | null) {
    if (isSameRecord(todo.linked, record)) return;
    await writeRecords([todo.linked, record], () =>
      record
        ? link.submit({
            todo: todo.name,
            doctype: record.doctype,
            name: record.name,
          })
        : unlink.submit({ todo: todo.name }),
    );
  }

  /** Creates or updates the ToDo and its link; resolves `true` when it saved. */
  async function save(form: TodoForm): Promise<boolean> {
    if (saving.value) return false;
    const fields = toTodoFields(form, customFields);
    const todo = editing.value;
    const linkedTo = form.linkedTo;
    saving.value = true;
    try {
      if (todo) {
        await updateLink(todo, linkedTo);
        await localWrite(
          () => update.submit({ todo: todo.name, values: fields }),
          () => todo.name,
        );
      } else if (linkedTo) {
        await localWrite(
          () =>
            writeRecords([linkedTo], () =>
              createLinked.submit({
                doctype: linkedTo.doctype,
                name: linkedTo.name,
                todo: fields,
              }),
            ),
          (created) => created?.name,
        );
      } else {
        await localWrite(
          () => create.submit({ project: toValue(projectId), todo: fields }),
          (created) => created?.name,
        );
        refresh();
      }
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    } finally {
      saving.value = false;
      // As React: the list and links reload even when an edit failed, as its link
      // may have changed.
      if (todo || linkedTo) refreshLinks();
    }
    toast.success(todo ? "ToDo updated" : "ToDo created");
    return true;
  }

  return {
    customFields,
    todos,
    linkedTo,
    /** True until a load answers with rows or an error. */
    loading: computed(() => !list.data && !list.error),
    /** A failed load with no rows to show; a failed refetch shows a toast instead. */
    loadError: computed(() => (list.data ? null : list.error)),
    load,
    loadLinkable,
    refresh,
    refreshLinks,
    trackRecordWrites,
    canLink,
    /** True while the linkable records load for the first time. */
    linkableLoading: computed(() => linkable.loading && !linkable.data),
    linkableRecords: computed(() => linkable.data ?? []),
    statusOf: (todo: Todo) => pendingStatus.get(todo.name) ?? todo.status,
    isStatusBusy: (todo: Todo) => pendingStatus.has(todo.name),
    toggleDone,
    requestDelete,
    requestUnlink,
    editing,
    createLinkedTo,
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
 * them: the list with each ToDo's linked record (loaded on first `load()`, refetched on
 * realtime ToDo changes), the records ToDos may be linked to, the one create / edit
 * dialog, done / reopen, unlink and delete.
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
