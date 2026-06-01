/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  ErrorMessage,
  Select,
  Textarea,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import { FrappeError, useFrappeUpdateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { RISK_LEVELS, RISK_STATUSES } from "../constants";
import { RiskStatusBadge } from "../riskStatusBadge";
import { addUpdateSchema } from "./schema";
import type { AddUpdateModalProps } from "./types";
import { RiskLevelBadge } from "../riskLevelBadge";

export function AddUpdateModal({
  open,
  onClose,
  risk,
  onSuccess,
  editEntry,
}: AddUpdateModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const { updateDoc } = useFrappeUpdateDoc();
  const isEditing = !!editEntry;

  const riskLevelOptions = RISK_LEVELS.map((l) => ({
    label: (
      <RiskLevelBadge className="bg-transparent p-0" level={l} />
    ) as unknown as string,
    value: l,
  }));
  const statusOptions = RISK_STATUSES.map((s) => ({
    label: (
      <RiskStatusBadge className="bg-transparent p-0" status={s} />
    ) as unknown as string,
    value: s,
  }));

  const form = useForm({
    defaultValues: {
      status: (risk.status as string | null) ?? null,
      risk_level: (risk.risk_level as string | null) ?? null,
      note: "",
    },
    validators: {
      onSubmit: addUpdateSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        const existingEntries = (risk.risk_update_log ?? []).map((e) => ({
          name: e.name,
          status: e.status,
          risk_level: e.risk_level,
          note: e.note,
          updated_at: e.updated_at,
        }));

        if (isEditing && editEntry) {
          const updatedEntries = existingEntries.map((e) =>
            e.name === editEntry.name
              ? {
                  ...e,
                  ...(value.status ? { status: value.status } : {}),
                  ...(value.risk_level ? { risk_level: value.risk_level } : {}),
                  note: value.note,
                }
              : e,
          );
          await updateDoc("Risk", risk.name, {
            modified: risk.modified,
            risk_update_log: updatedEntries,
          });
        } else {
          const newEntry = {
            ...(value.status ? { status: value.status } : {}),
            ...(value.risk_level ? { risk_level: value.risk_level } : {}),
            ...(value.note ? { note: value.note } : {}),
          };
          await updateDoc("Risk", risk.name, {
            modified: risk.modified,
            risk_update_log: [...existingEntries, newEntry],
          });
        }

        onSuccess();
        closeModal();
      } catch (err) {
        throw err as FrappeError;
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

  // Re-seed defaults when modal opens or editEntry changes
  useEffect(() => {
    if (!open) return;
    if (isEditing && editEntry) {
      form.setFieldValue("status", (editEntry.status as string | null) ?? null);
      form.setFieldValue(
        "risk_level",
        (editEntry.risk_level as string | null) ?? null,
      );
      form.setFieldValue("note", editEntry.note ?? "");
    } else {
      form.setFieldValue("status", (risk.status as string | null) ?? null);
      form.setFieldValue(
        "risk_level",
        (risk.risk_level as string | null) ?? null,
      );
      form.setFieldValue("note", "");
    }
  }, [form, open, risk, editEntry, isEditing]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      options={{ title: isEditing ? "Edit update" : "Add update", size: "md" }}
      actions={
        <Button
          className="w-full h-7"
          variant="solid"
          label={isEditing ? "Save update" : "Add update"}
          onClick={() => form.handleSubmit()}
          disabled={submitting}
          loading={submitting}
        />
      }
    >
      <div className="-mt-2 space-y-4">
        {/* Status */}
        <form.Field
          name="status"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">Status</label>
              <Select
                options={statusOptions}
                value={field.state.value ?? ""}
                onChange={(val) =>
                  field.handleChange((val ?? null) as string | null)
                }
                placeholder="Select status"
              />
              {field.state.meta.errors.length > 0 && (
                <ErrorMessage message={String(field.state.meta.errors[0])} />
              )}
            </div>
          )}
        />

        {/* Risk level */}
        <form.Field
          name="risk_level"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">Risk</label>
              <Select
                options={riskLevelOptions}
                value={field.state.value ?? ""}
                onChange={(val) =>
                  field.handleChange((val ?? null) as string | null)
                }
                placeholder="Select risk level"
              />
              {field.state.meta.errors.length > 0 && (
                <ErrorMessage message={String(field.state.meta.errors[0])} />
              )}
            </div>
          )}
        />

        {/* Note */}
        <form.Field
          name="note"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">Note</label>
              <Textarea
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Add a note..."
                rows={4}
              />
            </div>
          )}
        />
      </div>
    </Dialog>
  );
}
