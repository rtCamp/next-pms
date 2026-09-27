/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Combobox,
  DatePicker,
  Dialog,
  ErrorMessage,
  FormLabel,
  Select,
  TextEditor,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { Calendar } from "@rtcamp/frappe-ui-react/icons";
import { useForm } from "@tanstack/react-form";
import { format } from "date-fns";
import { FrappeError, useFrappeCreateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import { CLIENT_PRIORITIES, GROWTH_DOCTYPE } from "../constants";
import { useGrowth } from "../context";
import { EDITOR_CLASS, EMPTY_GROWTH_VALUES, INPUT_CLASS } from "./constants";
import { EmployeeField } from "./employeeField";
import { createGrowthSchema } from "./schema";
import type { CreateGrowthModalProps } from "./types";

const today = () => format(new Date(), "yyyy-MM-dd");

const PRIORITY_OPTIONS = CLIENT_PRIORITIES.map((p) => ({
  label: p,
  value: p,
}));

export function CreateGrowthModal({ open, onClose }: CreateGrowthModalProps) {
  const projectId = useProjectDetail((s) => s.projectId);
  const refresh = useGrowth((c) => c.actions.refresh);
  const statuses = useGrowth((c) => c.state.statuses);
  const categories = useGrowth((c) => c.state.categories);
  const mastersLoading = useGrowth((c) => c.state.isMastersLoading);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toast = useToasts();
  const { createDoc } = useFrappeCreateDoc();

  const form = useForm({
    defaultValues: EMPTY_GROWTH_VALUES,
    validators: { onSubmit: createGrowthSchema },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        await createDoc(GROWTH_DOCTYPE, {
          project: projectId,
          activity: value.activity,
          category: value.category || null,
          description: value.description,
          client_priority: value.client_priority,
          status: value.status,
          desired_outcome: value.desired_outcome,
          ideation_date: value.ideation_date,
          activity_owner: value.activity_owner || null,
          ideation_owner: value.ideation_owner || null,
          billable_outcome: value.billable_outcome
            ? Number(value.billable_outcome)
            : 0,
        });
        toast.success("Growth initiative created");
        refresh();
        closeModal();
      } catch (err) {
        const message = parseFrappeErrorMsg(err as FrappeError);
        setSubmitError(message);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (open) form.reset({ ...EMPTY_GROWTH_VALUES, ideation_date: today() });
  }, [open, form]);

  const closeModal = useCallback(() => {
    onClose();
    setSubmitError(null);
    form.reset(EMPTY_GROWTH_VALUES);
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
      className="my-0 max-w-110"
      classNames={{
        viewport: "justify-start pt-30",
        header: "mb-5.25",
        content: "pt-5 pb-4 max-h-[70vh] overflow-y-auto scrollbar-thin",
        footer: "pb-6",
      }}
      options={{ title: "Create growth initiative", size: "md" }}
      actions={
        <Button
          className="w-full h-7"
          variant="solid"
          label="Create"
          onClick={() => form.handleSubmit()}
          disabled={submitting || mastersLoading}
          loading={submitting}
        />
      }
    >
      <div className="-mt-2 space-y-4">
        <form.Field
          name="activity"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Activity
              </FormLabel>
              <TextInput
                size="md"
                variant="outline"
                placeholder="Enter activity"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className={INPUT_CLASS}
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
              <label className="block text-base text-ink-gray-5">
                Category
              </label>
              <Combobox
                inputClassName={`h-8 ${INPUT_CLASS}`}
                loading={mastersLoading}
                options={categories.map((c) => ({
                  label: c.name,
                  value: c.name,
                }))}
                placeholder="Select category"
                value={field.state.value}
                onChange={(val) => field.handleChange(val)}
                openOnFocus
                clearable
              />
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
                placeholder="Describe the initiative..."
                content={field.state.value}
                onChange={(value) => field.handleChange(value)}
                fixedMenu={false}
                editorClass={EDITOR_CLASS}
              />
            </div>
          )}
        />

        <form.Field
          name="client_priority"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Priority for client
              </label>
              <Select
                className="text-ink-gray-7 **:data-placeholder:text-ink-gray-4"
                variant="outline"
                options={PRIORITY_OPTIONS}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Select priority"
              />
            </div>
          )}
        />

        <form.Field
          name="status"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Status
              </FormLabel>
              <Select
                className="text-ink-gray-7 **:data-placeholder:text-ink-gray-4"
                variant="outline"
                options={statuses.map((s) => ({
                  label: s.name,
                  value: s.name,
                }))}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Select status"
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="desired_outcome"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Desired outcome / ROI
              </label>
              <TextEditor
                placeholder="Describe the desired outcome..."
                content={field.state.value}
                onChange={(value) => field.handleChange(value)}
                fixedMenu={false}
                editorClass={EDITOR_CLASS}
              />
            </div>
          )}
        />

        <form.Field
          name="ideation_date"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Ideation date
              </FormLabel>
              <DatePicker
                label="Ideation date"
                value={field.state.value}
                onChange={(val) => field.handleChange(val as string)}
                placeholder="Ideation date"
              >
                {({ displayValue }) => (
                  <div className="flex relative items-center py-1 w-full rounded border border-outline-gray-2 px-2.5">
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
          name="activity_owner"
          children={(field) => (
            <EmployeeField
              label="Activity owner"
              placeholder="Select activity owner"
              enabled={open}
              value={field.state.value}
              onChange={field.handleChange}
            />
          )}
        />

        <form.Field
          name="ideation_owner"
          children={(field) => (
            <EmployeeField
              label="Ideation owner"
              placeholder="Select ideation owner"
              enabled={open}
              value={field.state.value}
              onChange={field.handleChange}
            />
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
                className={INPUT_CLASS}
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        {submitError ? <ErrorMessage message={submitError} /> : null}
      </div>
    </Dialog>
  );
}
