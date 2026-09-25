/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getTodayDate } from "@next-pms/design-system/date";
import {
  Avatar,
  Button,
  Checkbox,
  Combobox,
  DatePicker,
  Dialog,
  ErrorMessage,
  FormLabel,
  Select,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { Calendar } from "@rtcamp/frappe-ui-react/icons";
import { useForm } from "@tanstack/react-form";
import {
  FrappeError,
  useFrappeGetDocList,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useUserLookup } from "@/hooks/useUserLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { TimelineItemCategory } from "../types";
import { createTouchpointSchema } from "./schema";
import type { CreateTouchpointModalProps } from "./types";

const defaultValues = {
  title: "",
  scheduledDate: getTodayDate(),
  owner: "",
  category: "Other - Touchpoint",
  isInternal: false,
};

export function CreateTouchpointModal({
  open,
  onOpenChange,
  projectId,
  onSuccess,
  item,
}: CreateTouchpointModalProps) {
  const toast = useToasts();
  const [ownerSearch, setOwnerSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = Boolean(item);

  const { call: createTouchpoint } = useFrappePostCall(
    "next_pms.next_projects.api.project_timeline_item.create_project_timeline_item",
  );

  const { call: editTouchpoint } = useFrappePostCall(
    "next_pms.next_projects.api.project_timeline_item.edit_project_timeline_item",
  );

  const { options: ownerOptions, isLoading: isOwnerLookupLoading } =
    useUserLookup({
      shouldFetch: open,
      pageSize: 20,
      query: ownerSearch,
    });

  const ownerOptionsWithAvatars = useMemo(
    () =>
      ownerOptions.map((opt) => ({
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
    [ownerOptions],
  );

  const { data: categories } = useFrappeGetDocList<TimelineItemCategory>(
    "Project Timeline Item Category",
    {
      fields: ["name", "category_name"],
      filters: [["applies_to", "=", "Touchpoint"]],
      orderBy: { field: "position", order: "asc" },
      limit: 100,
    },
    open ? undefined : null,
  );

  const categoryOptions = (categories ?? []).map((c) => ({
    label: c.category_name,
    value: c.name,
  }));

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: createTouchpointSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        if (isEditMode && item) {
          await editTouchpoint({
            name: item.id,
            title: value.title,
            item_owner: value.owner,
            category: value.category,
            is_internal: value.isInternal ? 1 : 0,
            planned_end_date: value.scheduledDate,
          });
          toast.success("Touchpoint updated successfully");
        } else {
          await createTouchpoint({
            project: projectId,
            type: "Touchpoint",
            title: value.title,
            item_owner: value.owner,
            category: value.category,
            is_internal: value.isInternal ? 1 : 0,
            planned_end_date: value.scheduledDate,
          });
          toast.success("Touchpoint created successfully");
        }
        closeModal();
        await onSuccess?.();
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      } finally {
        setSubmitting(false);
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

  useEffect(() => {
    if (!open) return;
    if (isEditMode && item) {
      form.setFieldValue("title", item.title);
      form.setFieldValue(
        "scheduledDate",
        item.plannedEndDate ?? getTodayDate(),
      );
      form.setFieldValue("owner", item.owner?.name ?? "");
      form.setFieldValue("category", item.category ?? defaultValues.category);
      form.setFieldValue("isInternal", item.isInternal);
    } else {
      form.reset();
    }
  }, [form, open, isEditMode, item]);

  useEffect(() => {
    setOwnerSearch(isEditMode && item ? (item.owner?.fullName ?? "") : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      className="my-0 max-w-110"
      classNames={{
        viewport: "justify-start pt-30",
        header: "mb-5.25",
        content: "pt-5 pb-4",
        footer: "pb-6",
      }}
      options={{ title: isEditMode ? "Edit touchpoint" : "Create touchpoint" }}
      actions={
        <Button
          className="w-full h-7"
          variant="solid"
          label={isEditMode ? "Save" : "Create"}
          onClick={() => form.handleSubmit()}
          disabled={submitting}
          loading={submitting}
        />
      }
    >
      <div className="-mt-2 space-y-4">
        <form.Field
          name="title"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Touchpoint name
              </FormLabel>
              <TextInput
                size="md"
                variant="outline"
                placeholder="Enter touchpoint name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="bg-surface-white border-outline-gray-2 text-ink-gray-7"
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="category"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Type
              </FormLabel>
              <Select
                className="text-ink-gray-7"
                variant="outline"
                options={categoryOptions}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Select type"
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="scheduledDate"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Scheduled date
              </FormLabel>
              <DatePicker
                label="Scheduled date"
                value={field.state.value}
                onChange={(val) => field.handleChange(val as string)}
                placeholder="Scheduled date"
              >
                {({ displayValue }) => (
                  <div className="flex relative items-center py-1 w-full rounded-lg border border-outline-gray-2 px-2.5">
                    <input
                      readOnly
                      type="text"
                      value={displayValue}
                      className="flex-1 text-base text-ink-gray-7"
                    />
                    <Calendar className="size-4" />
                  </div>
                )}
              </DatePicker>
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="owner"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Owner
              </FormLabel>
              <Combobox
                inputClassName="bg-surface-white h-8 border-outline-gray-2 text-ink-gray-7"
                loading={isOwnerLookupLoading}
                options={ownerOptionsWithAvatars}
                searchValue={ownerSearch}
                placeholder="Select owner"
                value={field.state.value}
                onChange={(value) => field.handleChange(value as string)}
                onSearchChange={setOwnerSearch}
                openOnFocus
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="isInternal"
          children={(field) => (
            <label className="inline-flex items-center gap-2 text-base text-ink-gray-7">
              <Checkbox
                value={field.state.value}
                onChange={(checked) => field.handleChange(Boolean(checked))}
              />
              Mark as internal
            </label>
          )}
        />
      </div>
    </Dialog>
  );
}

export default CreateTouchpointModal;
