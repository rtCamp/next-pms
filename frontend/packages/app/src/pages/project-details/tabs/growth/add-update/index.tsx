/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  ErrorMessage,
  FormLabel,
  Select,
  TextEditor,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import { FrappeError, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import {
  CLIENT_PRIORITY_OPTIONS,
  FORM_EDITOR_CLASS,
  FORM_INPUT_CLASS,
  GROWTH_DOCTYPE,
} from "../constants";
import { useGrowth } from "../context";
import type { ClientPriority, GrowthUpdateEntry } from "../types";
import { EMPTY_UPDATE_VALUES } from "./constants";
import { toUpdateLogRows, type GrowthUpdateRow } from "./payload";
import { buildAddUpdateSchema, type AddUpdateValues } from "./schema";
import type { AddUpdateModalProps } from "./types";

type UpdateSource = Pick<
  GrowthUpdateEntry,
  "status" | "closed_status" | "client_priority" | "billable_outcome"
>;

const toFormValues = (source: UpdateSource, note = ""): AddUpdateValues => ({
  status: source.status ?? "",
  closed_status: source.closed_status ?? "",
  client_priority: source.client_priority ?? "",
  billable_outcome: source.billable_outcome
    ? String(source.billable_outcome)
    : "",
  note,
});

const toRowChanges = (
  value: AddUpdateValues,
  isClosed: boolean,
): Partial<GrowthUpdateRow> => ({
  ...(value.status
    ? {
        status: value.status,
        closed_status: isClosed ? value.closed_status : null,
      }
    : {}),
  ...(value.client_priority
    ? { client_priority: value.client_priority as ClientPriority }
    : {}),
  ...(value.billable_outcome !== ""
    ? { billable_outcome: Number(value.billable_outcome) }
    : {}),
  note: value.note,
});

export function AddUpdateModal({
  open,
  onClose,
  growth,
  onSuccess,
  editEntry,
}: AddUpdateModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const { updateDoc } = useFrappeUpdateDoc();
  const toast = useToasts();
  const statuses = useGrowth((c) => c.state.statuses);
  const closedStatuses = useGrowth((c) => c.state.closedStatuses);
  const mastersLoading = useGrowth((c) => c.state.isMastersLoading);
  const isEditing = !!editEntry;

  const isClosedStatus = useCallback(
    (status: string) =>
      statuses.some((s) => s.name === status && Boolean(s.is_closed)),
    [statuses],
  );
  const schema = useMemo(
    () => buildAddUpdateSchema(isClosedStatus),
    [isClosedStatus],
  );
  const statusOptions = useMemo(
    () => statuses.map((s) => ({ label: s.name, value: s.name })),
    [statuses],
  );
  const closedStatusOptions = useMemo(
    () => closedStatuses.map((s) => ({ label: s.name, value: s.name })),
    [closedStatuses],
  );
  const { status, closed_status, client_priority, billable_outcome } = growth;
  const initialValues = useMemo(
    () =>
      editEntry
        ? toFormValues(editEntry, editEntry.note ?? "")
        : toFormValues({
            status,
            closed_status,
            client_priority,
            billable_outcome,
          }),
    [editEntry, status, closed_status, client_priority, billable_outcome],
  );

  const form = useForm({
    defaultValues: EMPTY_UPDATE_VALUES,
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        const rows = toUpdateLogRows(growth.update_log ?? []);
        const changes = toRowChanges(value, isClosedStatus(value.status));
        const update_log: Partial<GrowthUpdateRow>[] = editEntry
          ? rows.map((row) =>
              row.name === editEntry.name ? { ...row, ...changes } : row,
            )
          : [...rows, changes];

        await updateDoc(GROWTH_DOCTYPE, growth.name, {
          modified: growth.modified,
          update_log,
        });
        toast.success(isEditing ? "Update saved" : "Update added");
        onSuccess();
        closeModal();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const closeModal = useCallback(() => {
    onClose();
    form.reset();
  }, [form, onClose]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) closeModal();
    },
    [closeModal],
  );

  useEffect(() => {
    if (!open) return;
    form.reset(initialValues, { keepDefaultValues: true });
  }, [open, initialValues, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      className="my-0 max-w-110"
      classNames={{
        viewport: "justify-start pt-30",
        header: "mb-5.25",
        content: "pt-5 pb-4 max-h-[70vh] overflow-y-auto scrollbar-thin",
        footer: "pb-6",
      }}
      options={{ title: isEditing ? "Edit update" : "Add update", size: "md" }}
      actions={
        <Button
          className="w-full h-7"
          variant="solid"
          label={isEditing ? "Save update" : "Add update"}
          onClick={() => form.handleSubmit()}
          disabled={submitting || mastersLoading}
          loading={submitting}
        />
      }
    >
      <div className="-mt-2 space-y-4">
        <form.Field
          name="status"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">Status</label>
              <Select
                className="text-ink-gray-7 **:data-placeholder:text-ink-gray-4"
                variant="outline"
                options={statusOptions}
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  if (!isClosedStatus(e.target.value)) {
                    form.setFieldValue("closed_status", "");
                  }
                }}
                placeholder="Select status"
              />
            </div>
          )}
        />

        <form.Subscribe selector={(state) => state.values.status}>
          {(status) =>
            isClosedStatus(status) && (
              <form.Field
                name="closed_status"
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <FormLabel size="md" required>
                      Closed status
                    </FormLabel>
                    <Select
                      className="text-ink-gray-7 **:data-placeholder:text-ink-gray-4"
                      variant="outline"
                      options={closedStatusOptions}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Select closed status"
                    />
                    {!field.state.meta.isValid && (
                      <ErrorMessage
                        message={field.state.meta.errors[0]?.message}
                      />
                    )}
                  </div>
                )}
              />
            )
          }
        </form.Subscribe>

        <form.Field
          name="client_priority"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Priority for Client
              </label>
              <Select
                className="text-ink-gray-7 **:data-placeholder:text-ink-gray-4"
                variant="outline"
                options={CLIENT_PRIORITY_OPTIONS}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Select priority"
              />
            </div>
          )}
        />

        <form.Field
          name="billable_outcome"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Billable outcome
              </label>
              <TextInput
                type="number"
                size="md"
                variant="outline"
                min={0}
                placeholder="0"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className={FORM_INPUT_CLASS}
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="note"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Note
              </FormLabel>
              <TextEditor
                placeholder="Add a note..."
                content={field.state.value}
                onChange={(value) => field.handleChange(value)}
                fixedMenu={false}
                editorClass={FORM_EDITOR_CLASS}
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />
      </div>
    </Dialog>
  );
}
