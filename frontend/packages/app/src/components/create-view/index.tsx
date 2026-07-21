/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import {
  Button,
  Dialog,
  ErrorMessage,
  Switch,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";

/**
 * Internal dependencies.
 */
import { EmojiPicker } from "./emojiPicker";
import { createViewFormSchema } from "./schema";
import type { CreateViewModalProps } from "./types";

function CreateViewModal({
  open,
  onOpenChange,
  createView,
}: CreateViewModalProps) {
  const toast = useToasts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      isPublic: false,
      icon: "📋",
    },
    validators: {
      onSubmit: createViewFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await createView({
          name: value.name,
          label: value.name,
          isPublic: value.isPublic,
          icon: value.icon,
        });
        toast.success("View created successfully");
        closeModal();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create view",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const closeModal = useCallback(() => {
    onOpenChange(false);
    form.reset();
  }, [form, onOpenChange]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        onOpenChange(true);
        return;
      }
      closeModal();
    },
    [closeModal, onOpenChange],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      options={{
        title: () => <span className="text-lg font-medium">Create View</span>,
      }}
      className="my-0"
      classNames={{
        header: "mb-5",
        content: "pt-5 pb-2",
        viewport: "justify-start pt-30",
        footer: "pb-6",
      }}
      actions={
        <div className="flex items-center justify-end w-full gap-2">
          <Button
            variant="ghost"
            label="Cancel"
            onClick={closeModal}
            disabled={isSubmitting}
          />
          <Button
            variant="solid"
            label="Create"
            onClick={() => form.handleSubmit()}
            disabled={isSubmitting}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-base text-ink-gray-5 mb-1.5">Name</label>
          <div className="flex items-start gap-2">
            <form.Field
              name="icon"
              children={(field) => (
                <EmojiPicker
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            />
            <form.Field
              name="name"
              children={(field) => (
                <div className="flex-1">
                  <TextInput
                    className="w-full"
                    size="md"
                    variant="outline"
                    placeholder="View Name"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {!field.state.meta.isValid && (
                    <ErrorMessage
                      message={field.state.meta.errors[0]?.message}
                    />
                  )}
                </div>
              )}
            />
          </div>
        </div>

        <form.Field
          name="isPublic"
          children={(field) => (
            <Switch
              size="sm"
              label="Make this view public"
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        />
      </div>
    </Dialog>
  );
}

export default CreateViewModal;
