/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  type FrappeError,
  useFrappeCreateDoc,
  useFrappeDeleteDoc,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { hasTodoCustomFields, parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import { useUser } from "@/providers/user";
import { TodosContext, type TodosContextProps } from "./context";
import { TODO_API } from "../constants";
import type { TodoStatus } from "../create-todo/schema";
import type { CreateTodoInput, TodoDoc, TodoOwner } from "../types";
import { useTodosData } from "../useTodosData";
import { fromLinkKey, toLinkKey } from "../utils";

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

interface TodosProviderProps extends PropsWithChildren {
  owner?: TodoOwner;
  onOwnerChange?: () => void;
  enabled?: boolean;
}

export function TodosProvider({
  children,
  owner,
  onOwnerChange,
  enabled = true,
}: TodosProviderProps) {
  const projectId = useProjectDetail((s) => s.projectId);
  const userId = useUser(({ state }) => state.userId);
  const { createDoc, loading: isCreating } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();
  const { call: createLinkedTodo } = useFrappePostCall<{ message: TodoDoc }>(
    `${TODO_API}.create_linked_todo`,
  );
  const { call: linkTodo } = useFrappePostCall(`${TODO_API}.link_todo`);
  const { call: unlinkTodoCall } = useFrappePostCall(`${TODO_API}.unlink_todo`);
  const toast = useToasts();
  const [pending, setPending] = useState(false);
  const { todos, isLoading, error, mutate, mutateLinks } = useTodosData(
    owner?.todos,
    enabled,
  );

  const refresh = useCallback(async () => {
    await Promise.all([mutate(), mutateLinks()]);
    onOwnerChange?.();
  }, [mutate, mutateLinks, onOwnerChange]);

  const createTodo = useCallback(
    async (input: CreateTodoInput) => {
      setPending(true);
      try {
        const target = owner ?? fromLinkKey(input.linkedTo);
        const doc = target
          ? (
              await createLinkedTodo({
                doctype: target.doctype,
                name: target.name,
                todo: toTodoFields(input),
              })
            ).message
          : ((await createDoc("ToDo", {
              ...toTodoFields(input),
              assigned_by: userId,
              reference_type: "Project",
              reference_name: projectId,
            })) as TodoDoc);
        toast.success("To-do created");
        await refresh();
        return doc;
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [owner, createLinkedTodo, createDoc, userId, projectId, toast, refresh],
  );

  const updateTodo = useCallback(
    async (name: string, input: CreateTodoInput) => {
      setPending(true);
      try {
        const doc = (await updateDoc(
          "ToDo",
          name,
          toTodoFields(input),
        )) as TodoDoc;
        const currentLink = toLinkKey(
          todos.find((t) => t.name === name)?.linked,
        );
        if (!owner && input.linkedTo !== currentLink) {
          const target = fromLinkKey(input.linkedTo);
          await (target
            ? linkTodo({ todo: name, ...target })
            : unlinkTodoCall({ todo: name }));
        }
        toast.success("To-do updated");
        await refresh();
        return doc;
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [updateDoc, todos, owner, linkTodo, unlinkTodoCall, toast, refresh],
  );

  const updateTodoStatus = useCallback(
    async (name: string, status: TodoStatus) => {
      try {
        await updateDoc("ToDo", name, { status });
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [updateDoc, mutate, toast],
  );

  const unlinkTodo = useCallback(
    async (name: string) => {
      try {
        await unlinkTodoCall({ todo: name });
        toast.success("To-do unlinked");
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
        toast.success("To-do deleted");
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
        todos,
        owner: owner ?? null,
        isLoading,
        error,
        isCreating: isCreating || pending,
      },
      actions: {
        createTodo,
        updateTodo,
        updateTodoStatus,
        unlinkTodo,
        deleteTodo,
        refresh,
      },
    }),
    [
      todos,
      owner,
      isLoading,
      error,
      isCreating,
      pending,
      createTodo,
      updateTodo,
      updateTodoStatus,
      unlinkTodo,
      deleteTodo,
      refresh,
    ],
  );

  return (
    <TodosContext.Provider value={value}>{children}</TodosContext.Provider>
  );
}
