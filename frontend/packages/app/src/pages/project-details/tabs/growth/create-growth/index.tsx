/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "@next-pms/design-system/components";
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
import {
  FrappeError,
  useFrappeCreateDoc,
  useFrappeGetDoc,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import {
  currencyFormat,
  getDefaultCurrency,
  parseFrappeErrorMsg,
} from "@/lib/utils";
import { DisabledField } from "@/pages/project-details/components/disabledField";
import { UpdateLogNote } from "@/pages/project-details/components/updateLogNote";
import { useProjectDetail } from "@/pages/project-details/context";
import {
  CLIENT_PRIORITY_OPTIONS,
  FORM_EDITOR_CLASS,
  FORM_INPUT_CLASS,
  GROWTH_DOCTYPE,
} from "../constants";
import { useGrowth } from "../context";
import { PriorityBadge } from "../list/cells/priorityBadge";
import { StatusBadge } from "../list/cells/statusBadge";
import type { ApiGrowthDetail } from "../types";
import { EMPTY_GROWTH_VALUES } from "./constants";
import { EmployeeField } from "./employeeField";
import { buildGrowthSchema, type GrowthFormValues } from "./schema";
import type { CreateGrowthModalProps } from "./types";

const emptyCreateValues = (): GrowthFormValues => ({
  ...EMPTY_GROWTH_VALUES,
  ideation_date: format(new Date(), "yyyy-MM-dd"),
});

const toNameOptions = (docs: { name: string }[]) =>
  docs.map((doc) => ({ label: doc.name, value: doc.name }));

const toPayload = (value: GrowthFormValues) => ({
  activity: value.activity,
  category: value.category || null,
  description: value.description,
  desired_outcome: value.desired_outcome,
  ideation_date: value.ideation_date,
  activity_owner: value.activity_owner || null,
  ideation_owner: value.ideation_owner || null,
});

const toUpdateLogPayload = (value: GrowthFormValues, isClosed: boolean) => ({
  client_priority: value.client_priority,
  status: value.status,
  closed_status: isClosed ? value.closed_status : null,
  billable_outcome: value.billable_outcome ? Number(value.billable_outcome) : 0,
});

export function CreateGrowthModal({
  open,
  onClose,
  growthName,
}: CreateGrowthModalProps) {
  const projectId = useProjectDetail((s) => s.projectId);
  const currency = useProjectDetail(
    (s) => s.project?.custom_currency || getDefaultCurrency(),
  );
  const refresh = useGrowth((c) => c.actions.refresh);
  const statuses = useGrowth((c) => c.state.statuses);
  const closedStatuses = useGrowth((c) => c.state.closedStatuses);
  const categories = useGrowth((c) => c.state.categories);
  const mastersLoading = useGrowth((c) => c.state.isMastersLoading);
  const [submittingAction, setSubmittingAction] = useState<
    "createAnother" | "close" | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toast = useToasts();
  const { createDoc } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();

  const isEditMode = Boolean(growthName);

  const {
    data: existing,
    isLoading: existingLoading,
    mutate: mutateExisting,
  } = useFrappeGetDoc<ApiGrowthDetail>(
    GROWTH_DOCTYPE,
    growthName ?? "",
    growthName ? undefined : null,
  );

  const isClosedStatus = useCallback(
    (status: string) =>
      statuses.some((s) => s.name === status && Boolean(s.is_closed)),
    [statuses],
  );
  const schema = useMemo(
    () => buildGrowthSchema(isClosedStatus),
    [isClosedStatus],
  );

  const form = useForm({
    defaultValues: EMPTY_GROWTH_VALUES,
    validators: { onSubmit: schema },
    onSubmitMeta: { keepOpen: false },
    onSubmit: async ({ value, meta }) => {
      setSubmittingAction(meta.keepOpen ? "createAnother" : "close");
      setSubmitError(null);
      try {
        if (isEditMode && growthName) {
          await updateDoc(GROWTH_DOCTYPE, growthName, toPayload(value));
          void mutateExisting();
          toast.success("Growth initiative updated");
        } else {
          await createDoc(GROWTH_DOCTYPE, {
            project: projectId,
            ...toPayload(value),
            ...toUpdateLogPayload(value, isClosedStatus(value.status)),
          });
          toast.success("Growth initiative created");
        }
        refresh();
        if (meta.keepOpen) {
          form.reset(emptyCreateValues(), { keepDefaultValues: true });
          return;
        }
        closeModal();
      } catch (err) {
        const message = parseFrappeErrorMsg(err as FrappeError);
        setSubmitError(message);
        toast.error(message);
      } finally {
        setSubmittingAction(null);
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isEditMode) {
      if (!existing) return;
      form.reset(
        {
          activity: existing.activity ?? "",
          category: existing.category ?? null,
          description: existing.description ?? "",
          client_priority: existing.client_priority ?? "",
          status: existing.status ?? "",
          closed_status: existing.closed_status ?? "",
          desired_outcome: existing.desired_outcome ?? "",
          ideation_date: existing.ideation_date ?? "",
          activity_owner: existing.activity_owner ?? "",
          ideation_owner: existing.ideation_owner ?? "",
          billable_outcome: existing.billable_outcome
            ? String(existing.billable_outcome)
            : "",
        },
        { keepDefaultValues: true },
      );
      return;
    }
    form.reset(emptyCreateValues(), { keepDefaultValues: true });
  }, [open, isEditMode, existing, form]);

  const closeModal = useCallback(() => {
    onClose();
    setSubmitError(null);
    form.reset(EMPTY_GROWTH_VALUES);
  }, [form, onClose]);

  const submitDisabled =
    submittingAction !== null || mastersLoading || existingLoading;

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
      options={{
        title: isEditMode
          ? "Edit growth initiative"
          : "Create growth initiative",
        size: "md",
      }}
      actions={
        <div className="flex items-center justify-between w-full gap-2">
          {!isEditMode && (
            <Button
              className="w-full h-7"
              variant="subtle"
              label="Save and create another"
              onClick={() => form.handleSubmit({ keepOpen: true })}
              disabled={submitDisabled}
              loading={submittingAction === "createAnother"}
            />
          )}
          <Button
            className="w-full h-7"
            variant="solid"
            label="Save"
            onClick={() => form.handleSubmit()}
            disabled={submitDisabled}
            loading={submittingAction === "close"}
          />
        </div>
      }
    >
      {isEditMode && existingLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : (
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
                  className={FORM_INPUT_CLASS}
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
                  inputClassName={`h-8 ${FORM_INPUT_CLASS}`}
                  loading={mastersLoading}
                  options={toNameOptions(categories)}
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
                  editorClass={FORM_EDITOR_CLASS}
                />
              </div>
            )}
          />

          {isEditMode ? (
            <>
              <DisabledField label="Priority for Client">
                {existing?.client_priority ? (
                  <PriorityBadge priority={existing.client_priority} />
                ) : (
                  <span>—</span>
                )}
              </DisabledField>
              <DisabledField label="Status">
                <StatusBadge status={existing?.status} />
              </DisabledField>
              {existing?.closed_status && (
                <DisabledField label="Closed status">
                  {existing.closed_status}
                </DisabledField>
              )}
              <UpdateLogNote message="To change status, priority or billable outcome, add a new update instead." />
            </>
          ) : (
            <>
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
                name="status"
                children={(field) => (
                  <div className="flex flex-col gap-1.5">
                    <FormLabel size="md" required>
                      Status
                    </FormLabel>
                    <Select
                      className="text-ink-gray-7 **:data-placeholder:text-ink-gray-4"
                      variant="outline"
                      options={toNameOptions(statuses)}
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        if (!isClosedStatus(e.target.value)) {
                          form.setFieldValue("closed_status", "");
                        }
                      }}
                      placeholder="Select status"
                    />
                    {!field.state.meta.isValid && (
                      <ErrorMessage
                        message={field.state.meta.errors[0]?.message}
                      />
                    )}
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
                            options={toNameOptions(closedStatuses)}
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
            </>
          )}

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
                  editorClass={FORM_EDITOR_CLASS}
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

          {isEditMode ? (
            <DisabledField label="Billable outcome">
              {currencyFormat(currency).format(existing?.billable_outcome ?? 0)}
            </DisabledField>
          ) : (
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
                    <ErrorMessage
                      message={field.state.meta.errors[0]?.message}
                    />
                  )}
                </div>
              )}
            />
          )}

          {submitError ? <ErrorMessage message={submitError} /> : null}
        </div>
      )}
    </Dialog>
  );
}
