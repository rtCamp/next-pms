/**
 * External dependencies.
 */
import { useState } from "react";
import {
  Button,
  Dialog,
  ErrorMessage,
  FormLabel,
  TextInput,
  Tooltip,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { Link } from "@rtcamp/frappe-ui-react/icons";
import { useForm } from "@tanstack/react-form";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";
import { z } from "zod";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";

interface DocumentLinkButtonProps {
  doctype: string;
  docname: string;
  onSuccess: () => void;
}

const linkSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Enter a valid URL.")
    .refine((value) => /^https?:\/\//i.test(value), {
      message: "URL must start with http:// or https://",
    }),
  title: z.string().trim(),
});

const EMPTY_LINK = { url: "", title: "" };

export function DocumentLinkButton({
  doctype,
  docname,
  onSuccess,
}: DocumentLinkButtonProps) {
  const [open, setOpen] = useState(false);
  const toast = useToasts();
  const { call, loading } = useFrappePostCall("upload_file");

  const form = useForm({
    defaultValues: EMPTY_LINK,
    validators: { onSubmit: linkSchema },
    onSubmit: async ({ value }) => {
      const url = value.url.trim();
      try {
        await call({
          doctype,
          docname,
          file_url: url,
          file_name: value.title.trim() || new URL(url).hostname,
          is_private: 1,
        });
        toast.success("Link added");
        onSuccess();
        closeDialog();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
  });

  const closeDialog = () => {
    setOpen(false);
    form.reset();
  };

  return (
    <>
      <Tooltip text="Add link">
        <Button
          type="button"
          variant="ghost"
          icon={Link}
          aria-label="Add link"
          onClick={() => setOpen(true)}
        />
      </Tooltip>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => !nextOpen && closeDialog()}
        options={{ title: "Add link", size: "md" }}
        actions={
          <Button
            className="w-full"
            variant="solid"
            label="Add link"
            onClick={() => form.handleSubmit()}
            disabled={loading}
            loading={loading}
          />
        }
      >
        <div className="space-y-4">
          <form.Field
            name="url"
            children={(field) => (
              <div className="flex flex-col gap-1.5">
                <FormLabel size="md" required>
                  URL
                </FormLabel>
                <TextInput
                  type="url"
                  size="md"
                  variant="outline"
                  placeholder="https://drive.google.com/..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />
          <form.Field
            name="title"
            children={(field) => (
              <div className="flex flex-col gap-1.5">
                <FormLabel size="md">Title</FormLabel>
                <TextInput
                  size="md"
                  variant="outline"
                  placeholder="e.g. Proposal v2"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />
        </div>
      </Dialog>
    </>
  );
}
