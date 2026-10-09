/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { DeleteActionDialog } from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  type FrappeError,
  useFrappeCreateDoc,
  useFrappeDeleteDoc,
  useFrappePostCall,
  useFrappeUpdateDoc,
  useSWRConfig,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { hasTodoCustomFields, parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import { useUser } from "@/providers/user";
import { TodosContext, type TodosContextProps } from "./context";
import { TODO_API, todoLinksKey, todosKey } from "../constants";
import { CreateTodoModal } from "../create-todo";
import type { TodoStatus } from "../create-todo/schema";
import type { CreateTodoInput, LinkedRecord, Todo, TodoDoc } from "../types";
import {
  getTodoDeleteDescription,
  getUnlinkDescription,
  isSameRecord,
} from "../utils";

type Editor = { todo: Todo | null; linkedTo: LinkedRecord | null };

const toTodoFields = (input: CreateTodoInput) => ({
  description: input.description,
  status: input.status,
  allocated_to: input.assignee,
  priority: input.priority,
  ...(hasTodoCustomFields()
    ? {
        custom_title: input.title,
        custom_from_time: input.startAt,
        custom_to_time: input.endAt,
      }
    : {}),
});

export function TodosProvider({ children }: PropsWithChildren) {
  const projectId = useProjectDetail((s) => s.projectId);
  const userId = useUser(({ state }) => state.userId);
  const { mutate } = useSWRConfig();
  const { createDoc } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();
  const { call: createLinkedTodo } = useFrappePostCall<{ message: TodoDoc }>(
    `${TODO_API}.create_linked_todo`,
  );
  const { call: linkTodo } = useFrappePostCall(`${TODO_API}.link_todo`);
  const { call: unlinkTodoCall } = useFrappePostCall(`${TODO_API}.unlink_todo`);
  const toast = useToasts();
  const [isSaving, setIsSaving] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Todo | null>(null);
  const [unlinking, setUnlinking] = useState<Todo | null>(null);

  const refresh = useCallback(
    () =>
      Promise.all([
        mutate(todosKey(projectId)),
        mutate(todoLinksKey(projectId)),
      ]),
    [mutate, projectId],
  );

  const openCreate = useCallback(
    (linkedTo?: LinkedRecord) =>
      setEditor({ todo: null, linkedTo: linkedTo ?? null }),
    [],
  );
  const openEdit = useCallback(
    (todo: Todo) => setEditor({ todo, linkedTo: todo.linked ?? null }),
    [],
  );
  const closeEditor = useCallback(() => setEditor(null), []);

  const createTodo = useCallback(
    async (input: CreateTodoInput) => {
      setIsSaving(true);
      try {
        const doc = input.linkedTo
          ? (
              await createLinkedTodo({
                doctype: input.linkedTo.doctype,
                name: input.linkedTo.name,
                todo: toTodoFields(input),
              })
            ).message
          : ((await createDoc("ToDo", {
              ...toTodoFields(input),
              assigned_by: userId,
              reference_type: "Project",
              reference_name: projectId,
            })) as TodoDoc);
        toast.success("ToDo created");
        await refresh();
        return doc;
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        return undefined;
      } finally {
        setIsSaving(false);
      }
    },
    [createLinkedTodo, createDoc, userId, projectId, toast, refresh],
  );

  const updateTodo = useCallback(
    async (todo: Todo, input: CreateTodoInput) => {
      setIsSaving(true);
      try {
        if (!isSameRecord(todo.linked, input.linkedTo)) {
          await (input.linkedTo
            ? linkTodo({
                todo: todo.name,
                doctype: input.linkedTo.doctype,
                name: input.linkedTo.name,
              })
            : unlinkTodoCall({ todo: todo.name }));
        }
        const doc = (await updateDoc(
          "ToDo",
          todo.name,
          toTodoFields(input),
        )) as TodoDoc;
        toast.success("ToDo updated");
        return doc;
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        return undefined;
      } finally {
        await refresh();
        setIsSaving(false);
      }
    },
    [linkTodo, unlinkTodoCall, updateDoc, toast, refresh],
  );

  const updateTodoStatus = useCallback(
    async (name: string, status: TodoStatus) => {
      try {
        await updateDoc("ToDo", name, { status });
        await refresh();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [updateDoc, refresh, toast],
  );

  const unlinkTodo = useCallback(
    async (name: string) => {
      try {
        await unlinkTodoCall({ todo: name });
        toast.success("ToDo unlinked");
        await refresh();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [unlinkTodoCall, toast, refresh],
  );

  const deleteTodo = useCallback(
    async (name: string) => {
      try {
        await deleteDoc("ToDo", name);
        toast.success("ToDo deleted");
        await refresh();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [deleteDoc, toast, refresh],
  );

  const value = useMemo<TodosContextProps>(
    () => ({
      state: {
        isDialogOpen:
          editor !== null || deleting !== null || unlinking !== null,
        isSaving,
      },
      actions: {
        openCreate,
        openEdit,
        createTodo,
        updateTodo,
        updateTodoStatus,
        requestUnlink: setUnlinking,
        requestDelete: setDeleting,
      },
    }),
    [
      editor,
      deleting,
      unlinking,
      isSaving,
      openCreate,
      openEdit,
      createTodo,
      updateTodo,
      updateTodoStatus,
    ],
  );

  return (
    <TodosContext.Provider value={value}>
      {children}
      <CreateTodoModal
        open={editor !== null}
        onClose={closeEditor}
        todo={editor?.todo}
        linkedTo={editor?.linkedTo}
      />
      {unlinking?.linked && (
        <DeleteActionDialog
          title="Unlink ToDo"
          description={getUnlinkDescription(unlinking, unlinking.linked)}
          confirmLabel="Unlink"
          onClose={() => setUnlinking(null)}
          onConfirm={() => unlinkTodo(unlinking.name)}
        />
      )}
      {deleting && (
        <DeleteActionDialog
          title="Delete ToDo"
          description={getTodoDeleteDescription(deleting)}
          onClose={() => setDeleting(null)}
          onConfirm={() => deleteTodo(deleting.name)}
        />
      )}
    </TodosContext.Provider>
  );
}
