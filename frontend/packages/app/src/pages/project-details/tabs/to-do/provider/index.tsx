/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  type FrappeError,
  useFrappeCreateDoc,
  useFrappeDeleteDoc,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { hasTodoCustomFields, parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import { TodosContext, type TodosContextProps } from "./context";
import type { TodoStatus } from "../create-todo/schema";
import type { CreateTodoInput, TodoDoc } from "../types";
import { useTodosData } from "../useTodosData";

const customFieldValues = (input: CreateTodoInput) =>
  hasTodoCustomFields()
    ? {
        custom_title: input.title,
        custom_from_time: input.startAt,
        custom_to_time: input.endAt,
      }
    : {};

export function TodosProvider({ children }: PropsWithChildren) {
  const projectId = useProjectDetail((s) => s.projectId);
  const { createDoc, loading: isCreating } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();
  const toast = useToasts();
  const [pending, setPending] = useState(false);
  const { todos, isLoading, error, mutate } = useTodosData();

  const createTodo = useCallback(
    async (input: CreateTodoInput) => {
      setPending(true);
      try {
        const doc = (await createDoc("ToDo", {
          description: input.description,
          status: input.status,
          allocated_to: input.assignee,
          priority: input.priority,
          reference_type: "Project",
          reference_name: projectId,
          ...customFieldValues(input),
        })) as TodoDoc;
        toast.success("To-do created");
        await mutate();
        return doc;
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [createDoc, projectId, toast, mutate],
  );

  const updateTodo = useCallback(
    async (name: string, input: CreateTodoInput) => {
      setPending(true);
      try {
        const doc = (await updateDoc("ToDo", name, {
          description: input.description,
          status: input.status,
          allocated_to: input.assignee,
          priority: input.priority,
          ...customFieldValues(input),
        })) as TodoDoc;
        toast.success("To-do updated");
        await mutate();
        return doc;
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [updateDoc, mutate, toast],
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

  const deleteTodo = useCallback(
    async (name: string) => {
      try {
        await deleteDoc("ToDo", name);
        toast.success("To-do deleted");
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [deleteDoc, mutate, toast],
  );

  const value = useMemo<TodosContextProps>(
    () => ({
      state: {
        todos,
        isLoading,
        error,
        isCreating: isCreating || pending,
      },
      actions: {
        createTodo,
        updateTodo,
        updateTodoStatus,
        deleteTodo,
        refresh: mutate,
      },
    }),
    [
      todos,
      isLoading,
      error,
      isCreating,
      pending,
      createTodo,
      updateTodo,
      updateTodoStatus,
      deleteTodo,
      mutate,
    ],
  );

  return (
    <TodosContext.Provider value={value}>{children}</TodosContext.Provider>
  );
}
