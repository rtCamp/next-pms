/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Combobox,
  DateTimePicker,
  Dialog,
  ErrorMessage,
  Select,
  TextEditor,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { Calendar } from "@rtcamp/frappe-ui-react/icons";
import { useForm } from "@tanstack/react-form";

/**
 * Internal dependencies.
 */
import { useUserLookup } from "@/hooks/useUserLookup";
import { useUser } from "@/providers/user";
import { useTodos } from "../context";
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  createTodoSchema,
  type CreateTodoValues,
  type TodoPriority,
} from "./schema";
import type { CreateTodoModalProps } from "./types";

const PRIORITY_DOT_CLASS: Record<TodoPriority, string> = {
  Low: "bg-surface-green-5",
  Medium: "bg-surface-amber-5",
  High: "bg-surface-red-5",
};

const PriorityDot = ({ priority }: { priority: TodoPriority }) => (
  <span
    aria-hidden
    className={`inline-block size-2 rounded-full ${PRIORITY_DOT_CLASS[priority]}`}
  />
);

export function CreateTodoModal({ open, onClose }: CreateTodoModalProps) {
  const userId = useUser((state) => state.state.userId);
  const createTodo = useTodos((c) => c.actions.createTodo);
  const isCreating = useTodos((c) => c.state.isCreating);
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const emptyValues: CreateTodoValues = useMemo(
    () => ({
      title: "",
      description: "",
      status: "Open",
      assignee: userId ?? "",
      startAt: "",
      endAt: "",
      priority: "Medium",
    }),
    [userId],
  );

  const form = useForm({
    defaultValues: emptyValues,
    validators: { onSubmit: createTodoSchema },
    onSubmit: async ({ value }) => {
      const doc = await createTodo(value);
      if (doc) closeModal();
    },
  });

  const closeModal = useCallback(() => {
    onClose();
    form.reset(emptyValues);
  }, [form, onClose, emptyValues]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) closeModal();
    },
    [closeModal],
  );

  const { options: assigneeOptions, isLoading: isAssigneeLookupLoading } =
    useUserLookup({
      shouldFetch: open,
      pageSize: 20,
      query: assigneeSearch,
    });

  const assigneeOptionsWithAvatars = useMemo(
    () =>
      assigneeOptions.map((opt) => ({
        ...opt,
        icon: (
          <Avatar
            size="xs"
            shape="circle"
            image={opt.image}
            label={opt.label}
          />
        ),
      })),
    [assigneeOptions],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      options={{ title: "Add to-do", size: "lg" }}
      actions={
        <Button
          className="w-full h-7"
          variant="solid"
          label="Create"
          loading={isCreating}
          disabled={isCreating}
          onClick={() => form.handleSubmit()}
        />
      }
    >
      <div className="-mt-2 space-y-4">
        <form.Field
          name="title"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">Title</label>
              <TextInput
                size="md"
                variant="outline"
                placeholder="Add a title"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Description
              </label>
              <TextEditor
                content={field.state.value}
                onChange={(value) => field.handleChange(value)}
                placeholder="Add a description..."
                fixedMenu={false}
                editorClass="prose prose-sm max-w-none min-h-[160px] rounded-md border border-outline-gray-2 p-2 text-ink-gray-8 focus:outline-none"
              />
            </div>
          )}
        />

        <div className="flex flex-wrap items-center gap-2">
          <form.Field
            name="status"
            children={(field) => (
              <Select
                className="w-fit"
                size="sm"
                variant="subtle"
                value={field.state.value}
                options={STATUS_OPTIONS.map((o) => ({ ...o }))}
                onChange={(value) =>
                  value &&
                  field.handleChange(value as CreateTodoValues["status"])
                }
                prefix={() => (
                  <span
                    aria-hidden
                    className="inline-block size-3 rounded-full border border-outline-gray-3"
                  />
                )}
              />
            )}
          />

          <form.Field
            name="assignee"
            children={(field) => (
              <div className="flex flex-col gap-1">
                <div className="w-56">
                  <Combobox
                    inputClassName="bg-surface-gray-2 h-8 border-0"
                    loading={isAssigneeLookupLoading}
                    options={assigneeOptionsWithAvatars}
                    searchValue={assigneeSearch}
                    placeholder="Assignee"
                    value={field.state.value || null}
                    onChange={(value) =>
                      field.handleChange((value as string) ?? "")
                    }
                    onSearchChange={setAssigneeSearch}
                    openOnFocus
                  />
                </div>
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />

          <form.Field
            name="startAt"
            children={(field) => (
              <div className="flex flex-col gap-1">
                <DateTimePicker
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  placeholder="Start"
                >
                  {({ displayValue }) => (
                    <Button
                      type="button"
                      variant="subtle"
                      iconRight={Calendar}
                      className="gap-2 h-8"
                    >
                      <span className="truncate text-sm text-ink-gray-7">
                        {displayValue || "Start"}
                      </span>
                    </Button>
                  )}
                </DateTimePicker>
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />

          <form.Field
            name="endAt"
            children={(field) => (
              <div className="flex flex-col gap-1">
                <DateTimePicker
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  placeholder="End"
                >
                  {({ displayValue }) => (
                    <Button
                      type="button"
                      variant="subtle"
                      iconRight={Calendar}
                      className="gap-2 h-8"
                    >
                      <span className="truncate text-sm text-ink-gray-7">
                        {displayValue || "End"}
                      </span>
                    </Button>
                  )}
                </DateTimePicker>
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />

          <form.Field
            name="priority"
            children={(field) => (
              <Select
                className="w-fit"
                size="sm"
                variant="subtle"
                value={field.state.value}
                options={PRIORITY_OPTIONS.map((o) => ({ ...o }))}
                onChange={(value) =>
                  value &&
                  field.handleChange(value as CreateTodoValues["priority"])
                }
                prefix={() => <PriorityDot priority={field.state.value} />}
              />
            )}
          />
        </div>
      </div>
    </Dialog>
  );
}
