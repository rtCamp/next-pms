/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { DurationInput } from "@next-pms/design-system/components";
import { formatDateRange } from "@next-pms/design-system/date";
import {
  Button,
  Checkbox,
  Combobox,
  DateRangePicker,
  Dialog,
  ErrorMessage,
  TabButtons,
  Textarea,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm, useStore } from "@tanstack/react-form";
import {
  FrappeError,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";
import { Calendar } from "lucide-react";

/**
 * Internal dependencies.
 */
import { isWeekendEntryAllowed, parseFrappeErrorMsg } from "@/lib/utils";
import {
  addAllocationDefaultValues,
  allocationRecurrenceLabels,
} from "./constants";
import { addAllocationFormSchema } from "./schema";
import { ComboboxOption, type AddAllocationModalProps } from "./types";
import { computeTotalHours } from "./utils";

function AddAllocationModal({
  variant = "add",
  open,
  onOpenChange,
  onEditScheduleClick,
  initialValues,
}: AddAllocationModalProps) {
  const toast = useToasts();
  const weekendEntriesAllowed: boolean = isWeekendEntryAllowed();
  const [submitting, setSubmitting] = useState(false);

  const { call: handleAllocation } = useFrappePostCall(
    "next_pms.resource_management.api.allocation.handle_allocation",
  );

  const { data: employeesData } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Employee",
    fields: ["name", "employee_name"],
    limit_page_length: "null",
  });

  const { data: projectsData } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name", "customer"],
    filters: window.frappe?.boot?.global_filters.project,
    limit_page_length: "null",
  });

  const employeeOptions = useMemo(() => {
    const fromApi = (
      (employeesData?.message ?? []) as {
        name: string;
        employee_name: string;
      }[]
    ).map((employee) => ({
      label: employee.employee_name,
      value: employee.name,
    }));

    return fromApi as ComboboxOption[];
  }, [employeesData?.message]);

  const projectOptions = useMemo(() => {
    const fromApi = (
      (projectsData?.message ?? []) as {
        name: string;
        project_name: string;
        customer?: string;
      }[]
    ).map((project) => ({
      label: project.project_name,
      value: project.name,
      customer: project.customer,
    }));

    return fromApi as ComboboxOption[];
  }, [projectsData?.message]);

  const allocationName = initialValues?.allocationName;
  const mergedDefaultValues = useMemo(() => {
    const initialFormValues = {
      ...(initialValues ?? {}),
    };

    delete initialFormValues.allocationName;

    return {
      ...addAllocationDefaultValues,
      ...initialFormValues,
    };
  }, [initialValues]);

  const form = useForm({
    defaultValues: mergedDefaultValues,
    validators: {
      onSubmit: addAllocationFormSchema,
    },
    onSubmit: async ({ value }) => {
      const selectedProject = projectOptions.find(
        (project) => project.value === value.projectId,
      );

      if (!selectedProject?.customer) {
        toast.error("Selected project must have a customer before allocation.");
        return;
      }

      setSubmitting(true);

      const totalAllocatedHours = computeTotalHours({
        hoursPerDay: value.hoursPerDay,
        recurrence: value.recurrence,
        fromDate: value.fromDate,
        toDate: value.toDate,
        repeatFor: value.repeatFor ?? 0,
        includeWeekends: weekendEntriesAllowed && value.includeWeekends,
      });

      try {
        await handleAllocation({
          allocation: {
            doctype: "Resource Allocation",
            // For edit, we need to send the name to update existing record.
            ...(variant === "edit" && allocationName
              ? { name: allocationName }
              : {}),
            employee: value.employeeId,
            project: value.projectId,
            customer: selectedProject?.customer,
            allocation_start_date: value.fromDate,
            allocation_end_date: value.toDate,
            hours_allocated_per_day: value.hoursPerDay,
            total_allocated_hours: totalAllocatedHours,
            is_billable: Number(value.isBillable),
            status: value.isTentative ? "Tentative" : "Confirmed",
            note: value.note ?? "",
            include_weekends: weekendEntriesAllowed
              ? value.includeWeekends
              : false,
          },
          // Repeat weeks are only applied when creating a recurring allocation.
          repeat_till_week_count:
            variant === "edit" || value.recurrence === "one-time"
              ? 0
              : value.repeatFor,
        });

        toast.success(
          variant === "edit"
            ? "Allocation updated successfully"
            : "Allocation created successfully",
        );
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      } finally {
        setSubmitting(false);
        closeModal();
      }
    },
  });

  const closeModal = useCallback(() => {
    onOpenChange(false);
    form.reset(mergedDefaultValues);
  }, [form, mergedDefaultValues, onOpenChange]);

  useEffect(() => {
    if (!open || variant !== "edit") {
      return;
    }

    form.reset(mergedDefaultValues);
  }, [form, mergedDefaultValues, open, variant]);

  const recurrence = useStore(form.store, (state) => state.values.recurrence);
  const hoursPerDay = useStore(form.store, (state) => state.values.hoursPerDay);
  const repeatFor = useStore(
    form.store,
    (state) => state.values.repeatFor ?? 0,
  );
  const fromDate = useStore(form.store, (state) => state.values.fromDate);
  const toDate = useStore(form.store, (state) => state.values.toDate);
  const includeWeekendsValue = useStore(
    form.store,
    (state) => state.values.includeWeekends,
  );

  const totalHours = computeTotalHours({
    hoursPerDay,
    recurrence,
    fromDate,
    toDate,
    repeatFor,
    includeWeekends: weekendEntriesAllowed && includeWeekendsValue,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true);
          return;
        }

        closeModal();
      }}
      options={{
        title: () => (
          <span className="text-lg font-medium">
            {variant === "add" ? "Add Allocation" : "Edit Allocation"}
          </span>
        ),
      }}
      actions={
        <div className="flex items-center justify-between w-full gap-2 -mt-5">
          <form.Field
            name="isTentative"
            children={(field) => (
              <label className="inline-flex items-center gap-2 text-base shrink-0 text-ink-gray-6">
                <Checkbox
                  value={field.state.value}
                  onChange={(checked) => field.handleChange(Boolean(checked))}
                />
                Mark as tentative
              </label>
            )}
          />
          <div className="flex items-center justify-end w-full gap-2">
            <Button variant="ghost" label="Cancel" onClick={closeModal} />
            <Button
              variant="solid"
              label={variant === "add" ? "Allocate" : "Save Changes"}
              onClick={() => form.handleSubmit()}
              disabled={submitting}
              loading={submitting}
            />
          </div>
        </div>
      }
    >
      <div className="-mt-2 space-y-4">
        <form.Field
          name="employeeId"
          children={(field) => (
            <>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Employee
              </label>
              <Combobox
                inputClassName="bg-white h-8 border-outline-gray-2"
                options={employeeOptions}
                placeholder="Select Employee"
                value={field.state.value}
                onChange={(value) => field.handleChange(value as string)}
                openOnFocus
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </>
          )}
        />

        <form.Field
          name="projectId"
          children={(field) => (
            <>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Project
              </label>
              <Combobox
                inputClassName="bg-white h-8 border-outline-gray-2"
                options={projectOptions}
                placeholder="Select Project"
                value={field.state.value}
                onChange={(value) => field.handleChange(value as string)}
                openOnFocus
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </>
          )}
        />

        <form.Field
          name="recurrence"
          children={(field) => (
            <>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Recurrence
              </label>
              <TabButtons
                value={field.state.value}
                onChange={(value) =>
                  field.handleChange(value as "one-time" | "recurring")
                }
                buttons={Object.entries(allocationRecurrenceLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </>
          )}
        />

        {weekendEntriesAllowed ? (
          <form.Field
            name="includeWeekends"
            children={(field) => (
              <label className="inline-flex items-center gap-2 text-base text-ink-gray-8">
                <Checkbox
                  value={field.state.value}
                  onChange={(checked) => field.handleChange(Boolean(checked))}
                />
                Include weekends
              </label>
            )}
          />
        ) : null}

        <form.Field
          name="fromDate"
          children={(fromField) => (
            <form.Field
              name="toDate"
              children={(toField) => (
                <div className="flex w-full flex-col gap-1.5">
                  <div className="flex justify-between">
                    <label className="block text-base text-ink-gray-5">
                      Start and end date
                    </label>
                    {variant === "edit" ? (
                      <Button
                        variant="ghost"
                        label="Edit Schedule"
                        className="p-0 bg-transparent h-fit text-ink-gray-5 hover:bg-transparent focus:bg-transparent active:bg-transparent"
                        onClick={onEditScheduleClick}
                      />
                    ) : null}
                  </div>
                  <DateRangePicker
                    value={[fromField.state.value, toField.state.value]}
                    onChange={(value) => {
                      const rawFrom = value?.[0] ?? "";
                      const rawTo = value?.[1] ?? "";
                      const shouldSwap = rawFrom && rawTo && rawFrom > rawTo;
                      const nextFrom = shouldSwap ? rawTo : rawFrom;
                      const nextTo = shouldSwap ? rawFrom : rawTo;

                      fromField.handleChange(nextFrom);
                      toField.handleChange(nextTo);
                    }}
                    formatter={formatDateRange}
                    placeholder="Start Date - End Date"
                  >
                    {({ displayValue }) => (
                      <div className="w-full relative flex items-center border border-outline-gray-2 px-2.5 py-1 rounded-lg">
                        <input
                          readOnly
                          type="text"
                          id="start"
                          value={displayValue}
                          className="flex-1"
                        />
                        <Calendar className="size-4" />
                      </div>
                    )}
                  </DateRangePicker>
                  {(!fromField.state.meta.isValid ||
                    !toField.state.meta.isValid) && (
                    <ErrorMessage
                      message={
                        fromField.state.meta.errors[0]?.message ??
                        toField.state.meta.errors[0]?.message
                      }
                    />
                  )}
                </div>
              )}
            />
          )}
        />

        <div className="flex gap-3">
          <form.Field
            name="hoursPerDay"
            children={(field) => (
              <div className="shrink-0 flex flex-1 flex-col gap-1.5">
                <label className="block text-base text-ink-gray-5">
                  Hours / day
                </label>
                <DurationInput
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  variant="compact"
                />
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />

          {recurrence === "recurring" && (
            <form.Field
              name="repeatFor"
              children={(field) => (
                <div className="shrink-0 flex flex-1 flex-col gap-1.5">
                  <label className="block text-base text-ink-gray-5">
                    Repeat for
                  </label>
                  <TextInput
                    type="number"
                    size="md"
                    variant="outline"
                    value={field.state.value ?? ""}
                    onChange={(e) =>
                      field.handleChange(Math.max(1, Number(e.target.value)))
                    }
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

          <div className="shrink-0 flex flex-1 flex-col gap-1.5">
            <label className="block text-base text-ink-gray-5">
              Total hours
            </label>
            <TextInput
              disabled={true}
              size="md"
              value={totalHours}
              variant="outline"
            />
          </div>
        </div>

        <form.Field
          name="isBillable"
          children={(field) => (
            <label className="inline-flex items-center gap-2 text-base text-ink-gray-6">
              <Checkbox
                value={!field.state.value}
                onChange={(checked) => field.handleChange(!checked)}
              />
              Mark as non-billable
              <span className="inline-block rounded-full size-1 bg-surface-amber-3" />
            </label>
          )}
        />

        <form.Field
          name="note"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">Note</label>
              <Textarea
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Add a note"
                className="bg-white border-outline-gray-2"
              />
            </div>
          )}
        />
      </div>
    </Dialog>
  );
}

export default AddAllocationModal;
