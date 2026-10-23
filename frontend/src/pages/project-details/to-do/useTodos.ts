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
import { dialog, toast, useCall, useList } from "frappe-ui";
import { useDoctypeListUpdates } from "@/composables/useDoctypeListUpdates";
import { createOwnWrites } from "@/pages/project-details/ownWrites";
import { useSession } from "@/session";
import { errorMessage, isAbortError } from "@/utils/errors";
import { TODO_API, TODO_LIMIT } from "./constants";
import {
  assigneeIds,
  deleteTodoMessage,
  hasTodoCustomFields,
  isSameRecord,
  resolveTodos,
  todoFields,
  toTodoFields,
  unlinkTodoMessage,
} from "./todos";
import type {
  LinkedRecord,
  RecordRef,
  Todo,
  TodoDoc,
  TodoForm,
  TodoLinks,
  TodoStatus,
  TodoUser,
} from "./types";

/** Runs a write that saves a record, remembering the record `nameOf` names in its result. */
type RecordWriteTracker = <T>(
  write: () => Promise<T>,
  nameOf: (result: T) => string | undefined,
) => Promise<T>;

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
      if (list.data && !isAbortError(error)) toast.error(errorMessage(error));
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

  const project = () => ({ project: toValue(projectId) });
  const links = useCall<TodoLinks, { project: string }>({
    url: `${TODO_API}.get_todo_links`,
    params: project,
    immediate: false,
  });
  const linkable = useCall<LinkedRecord[], { project: string }>({
    url: `${TODO_API}.get_linkable_records`,
    params: project,
    immediate: false,
  });
  let linkableLoaded = false;

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
    links.fetch();
  }

  /** Loads the records the user may link ToDos to, once; `refreshLinks()` reloads them. */
  function loadLinkable() {
    if (linkableLoaded) return;
    linkableLoaded = true;
    linkable.fetch();
  }

  function refresh() {
    if (!loaded.value) return;
    list.reload();
    links.reload();
  }

  /** Reloads which ToDos are linked where, and what may be linked, after a linked record changed. */
  function refreshLinks() {
    if (loaded.value) links.reload();
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

  const todos = computed<Todo[]>(() =>
    resolveTodos(list.data ?? [], users.data ?? [], links.data ?? {}),
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
        if (todo.linked) refreshLinks();
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
          () => list.setValue.submit({ name: todo.name, ...fields }),
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
        list.reload();
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
      // As React: the links reload even when an edit failed, as its link may have changed.
      if (todo || linkedTo) refreshLinks();
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
