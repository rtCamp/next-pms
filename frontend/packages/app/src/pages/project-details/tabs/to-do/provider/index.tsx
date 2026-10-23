/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { DeleteActionDialog } from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  type FrappeError,
  useFrappePostCall,
  useSWRConfig,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { hasTodoCustomFields, parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import { TodosContext, type TodosContextProps } from "./context";
import { TODO_API, todosKey } from "../constants";
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
  const { mutate } = useSWRConfig();
  const { call: createProjectTodo } = useFrappePostCall<{ message: TodoDoc }>(
    `${TODO_API}.create_project_todo`,
  );
  const { call: updateProjectTodo } = useFrappePostCall<{ message: TodoDoc }>(
    `${TODO_API}.update_project_todo`,
  );
  const { call: deleteProjectTodo } = useFrappePostCall(
    `${TODO_API}.delete_project_todo`,
  );
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
    () => mutate(todosKey(projectId)),
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
        const { message: doc } = input.linkedTo
          ? await createLinkedTodo({
              doctype: input.linkedTo.doctype,
              name: input.linkedTo.name,
              todo: toTodoFields(input),
            })
          : await createProjectTodo({
              project: projectId,
              todo: toTodoFields(input),
            });
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
    [createLinkedTodo, createProjectTodo, projectId, toast, refresh],
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
        const { message: doc } = await updateProjectTodo({
          todo: todo.name,
          values: toTodoFields(input),
        });
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
    [linkTodo, unlinkTodoCall, updateProjectTodo, toast, refresh],
  );

  const updateTodoStatus = useCallback(
    async (name: string, status: TodoStatus) => {
      try {
        await updateProjectTodo({ todo: name, values: { status } });
        await refresh();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [updateProjectTodo, refresh, toast],
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
        await deleteProjectTodo({ todo: name });
        toast.success("ToDo deleted");
        await refresh();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [deleteProjectTodo, toast, refresh],
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
