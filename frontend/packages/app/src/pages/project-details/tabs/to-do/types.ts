/**
 * Internal dependencies.
 */
import type {
  CreateTodoValues,
  TodoPriority,
  TodoStatus,
} from "./create-todo/schema";

export type CreateTodoInput = CreateTodoValues;

export interface TodoDoc {
  name: string;
  allocated_to: string;
  assigned_by: string;
  assigned_by_full_name: string;
  custom_from_time: string;
  custom_title: string;
  custom_to_time: string;
  date: string;
  description: string;
  priority: TodoPriority;
  reference_name: string;
  reference_type: string;
  status: TodoStatus;
  owner: string;
  creation: string;
  modified: string;
}

export type TodoUserDetails = {
  name: string;
  full_name: string;
  user_image: string | null;
};

export type Todo = TodoDoc & {
  allocated_to_full_name: string;
  allocated_to_image: string | null;
};
