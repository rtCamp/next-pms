/**
 * External dependencies.
 */
import { useCallback } from "react";
import {
  Button,
  Dialog,
  ErrorMessage,
  TextEditor,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";

/**
 * Internal dependencies.
 */
import { createTodoSchema, type CreateTodoValues } from "./schema";
import type { CreateTodoModalProps } from "./types";

const emptyValues: CreateTodoValues = {
  title: "",
  description: "",
};

export function CreateTodoModal({ open, onClose }: CreateTodoModalProps) {
  const form = useForm({
    defaultValues: emptyValues,
    validators: { onSubmit: createTodoSchema },
    onSubmit: async () => {
      closeModal();
    },
  });

  const closeModal = useCallback(() => {
    onClose();
    form.reset(emptyValues);
  }, [form, onClose]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) closeModal();
    },
    [closeModal],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      options={{ title: "Add to-do", size: "md" }}
      actions={
        <Button
          className="w-full h-7"
          variant="solid"
          label="Create"
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
      </div>
    </Dialog>
  );
}
