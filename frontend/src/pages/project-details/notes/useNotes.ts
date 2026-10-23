import {
  computed,
  inject,
  onScopeDispose,
  provide,
  reactive,
  ref,
  shallowRef,
  watch,
  type InjectionKey,
} from "vue";
import { useRoute } from "vue-router";
import { dialog, toast, useCall } from "frappe-ui";
import { useQueryPatch } from "@/composables/useQueryPatch";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage, isAbortError } from "@/utils/errors";
import { queryString } from "@/utils/query";
import {
  GET_LIST_URL,
  NOTE_DOCTYPE,
  NOTE_LIST_LIMIT,
  NOTE_PARAM,
  NOTES_API,
  SEARCH_DEBOUNCE_MS,
} from "./constants";
import {
  authorIds,
  authorOptions,
  noteListFilters,
  publishedFilters,
  toNotes,
} from "./notes";
import type { Note, NoteDetails, NoteRow, NoteUser } from "./types";

type Params = Record<string, unknown>;

const NOTE_FIELDS = [
  "name",
  "title",
  "description",
  "status",
  "project",
  "pinned",
  "creation",
  "modified",
  "last_edited_at",
  "last_edited_by",
  "owner",
  "modified_by",
];

function createNotes() {
  const route = useRoute();
  const patchQuery = useQueryPatch();
  const { projectId } = useProjectDetails();

  /** The search boxes' text; the list follows it after a pause in typing. */
  const titleInput = ref("");
  const descriptionInput = ref("");
  const author = ref("");
  const search = reactive({ title: "", description: "" });

  const timers: Partial<
    Record<keyof typeof search, ReturnType<typeof setTimeout>>
  > = {};
  function debounce(source: () => string, key: keyof typeof search) {
    watch(source, (value) => {
      clearTimeout(timers[key]);
      timers[key] = setTimeout(() => (search[key] = value), SEARCH_DEBOUNCE_MS);
    });
  }
  debounce(() => titleInput.value, "title");
  debounce(() => descriptionInput.value, "description");
  onScopeDispose(() => Object.values(timers).forEach(clearTimeout));

  /** Notes saved since the list last loaded, laid over its rows. */
  const saved = shallowRef(new Map<string, Partial<NoteRow>>());

  const list = useCall<NoteRow[], Params>({
    url: GET_LIST_URL,
    params: () => ({
      doctype: NOTE_DOCTYPE,
      fields: JSON.stringify(NOTE_FIELDS),
      filters: JSON.stringify(
        noteListFilters(projectId.value, { ...search, author: author.value }),
      ),
      order_by: "pinned desc, creation desc",
      limit_page_length: NOTE_LIST_LIMIT,
    }),
    refetch: true,
    onSuccess: () => (saved.value = new Map()),
  });

  const authorRows = useCall<{ owner: string }[], Params>({
    url: GET_LIST_URL,
    params: () => ({
      doctype: NOTE_DOCTYPE,
      fields: JSON.stringify(["owner"]),
      filters: JSON.stringify(publishedFilters(projectId.value)),
      limit_page_length: NOTE_LIST_LIMIT,
    }),
  });
  const authors = computed(() => authorIds(authorRows.data ?? []));

  const users = useCall<NoteUser[], Params>({
    url: GET_LIST_URL,
    params: () => ({
      doctype: "User",
      fields: JSON.stringify(["name", "full_name", "user_image"]),
      filters: JSON.stringify([["name", "in", authors.value]]),
      limit_page_length: authors.value.length,
    }),
    immediate: false,
  });
  watch(
    () => authors.value.join(","),
    (ids) => {
      if (ids) users.fetch();
    },
  );

  const notes = computed(() =>
    toNotes(
      (list.data ?? []).map((row) => ({
        ...row,
        ...saved.value.get(row.name),
      })),
      users.data ?? [],
    ),
  );

  const loadError = computed(() =>
    list.error && !isAbortError(list.error) ? list.error : null,
  );

  function refresh() {
    return Promise.all([list.reload(), authorRows.reload()]);
  }

  const noteId = computed(() => queryString(route.query[NOTE_PARAM]));

  function openNote(name: string) {
    patchQuery({ [NOTE_PARAM]: name }, { push: true });
  }

  function closeNote() {
    patchQuery({ [NOTE_PARAM]: null }, { push: true });
  }

  const updateCall = useCall<NoteDetails, Params>({
    url: `${NOTES_API}.update_project_status_update`,
    method: "POST",
    immediate: false,
  });
  const deleteCall = useCall<unknown, Params>({
    url: `${NOTES_API}.delete_project_status_update`,
    method: "POST",
    immediate: false,
  });

  const updating = ref(false);

  async function togglePin(note: Note) {
    updating.value = true;
    try {
      await updateCall.submit({ name: note.name, pinned: note.pinned ? 0 : 1 });
      toast.success(note.pinned ? "Note unpinned" : "Note pinned");
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      updating.value = false;
    }
  }

  /** Saves a note's body; resolves whether it saved, after toasting a failure. */
  async function saveDescription(note: Note, description: string) {
    let result: NoteDetails | null;
    try {
      result = await updateCall.submit({ name: note.name, description });
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
    saved.value = new Map(saved.value).set(note.name, {
      description,
      ...(result && { modified: result.modified }),
    });
    return true;
  }

  function requestDelete(note: Note) {
    dialog.danger({
      title: "Delete note",
      message:
        "Are you sure you want to delete this note? This action cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await deleteCall.submit({ name: note.name });
        } catch (error) {
          throw new Error(errorMessage(error));
        }
        toast.success("Note deleted");
        refresh();
        patchQuery({ [NOTE_PARAM]: null }, { push: true });
      },
    });
  }

  return {
    titleInput,
    descriptionInput,
    author,
    authorOptions: computed(() =>
      authorOptions(authors.value, users.data ?? []),
    ),
    notes,
    loading: computed(() => list.loading),
    /** The list's first load is still running. */
    initialLoading: computed(() => list.loading && !list.data),
    loadError,
    refresh,
    /** The note open in the detail view (`?note=`), or `""`. */
    noteId,
    openNote,
    closeNote,
    updating,
    togglePin,
    saveDescription,
    requestDelete,
  };
}

export type NotesState = ReturnType<typeof createNotes>;

const notesKey: InjectionKey<NotesState> = Symbol("notes");

/**
 * The Notes tab's state, provided by `NotesTab`: the search and author filter, the
 * project's published notes with their authors, the open note (`?note=`), and pin,
 * delete and the detail view's body saves, after which the list is read again.
 */
export function provideNotes(): NotesState {
  const notes = createNotes();
  provide(notesKey, notes);
  return notes;
}

export function useNotes(): NotesState {
  const notes = inject(notesKey);
  if (!notes) throw new Error("useNotes() needs provideNotes() in a parent");
  return notes;
}
