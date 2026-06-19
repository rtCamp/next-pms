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
import { AlertTriangle } from "@rtcamp/frappe-ui-react/icons";
import { useForm, useStore } from "@tanstack/react-form";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";
import { Calendar } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useCustomerLookup } from "@/hooks/useCustomerLookup";
import { useEmployeeLookup } from "@/hooks/useEmployeeLookup";
import { useProjectLookup } from "@/hooks/useProjectLookup";
import { isWeekendEntryAllowed, parseFrappeErrorMsg } from "@/lib/utils";
import {
  buildSegmentEditOverridePatch,
  extendAllocationRange,
  shouldUseOverrideAwareAllocationEdit,
} from "@/pages/allocations/overrideEdit";
import {
  addAllocationDefaultValues,
  allocationRecurrenceLabels,
} from "./constants";
import { OverAllocationWarning } from "./overAllocationWarning";
import { addAllocationFormSchema } from "./schema";
import type { AddAllocationModalProps } from "./types";
import { useOverAllocation } from "./useOverAllocation";
import { computeTotalHours } from "./utils";

function AddAllocationModal({
  variant = "add",
  layoutVariant = "team",
  open,
  onOpenChange,
  onEditScheduleClick,
  initialValues,
  onSuccess,
}: AddAllocationModalProps) {
  const toast = useToasts();
  const weekendEntriesAllowed: boolean = isWeekendEntryAllowed();
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRecurringEdit =
    variant === "edit" && Boolean(initialValues?.recurrenceId);
  const hasExistingOverrides = (initialValues?.override?.length ?? 0) > 0;
  const isLockedAllocationMetadataEdit =
    variant === "edit" && (isRecurringEdit || hasExistingOverrides);

  const { call: handleAllocation } = useFrappePostCall(
    "next_pms.resource_management.api.allocation.handle_allocation",
  );

  const { call: editAllocation } = useFrappePostCall(
    "next_pms.resource_management.api.allocation.edit_allocation",
  );

  const { options: employeeOptions, isLoading: isEmployeeLookupLoading } =
    useEmployeeLookup({
      shouldFetch: open,
      pageSize: 20,
      query: employeeSearch,
    });

  const { options: projectOptions, isLoading: isProjectLookupLoading } =
    useProjectLookup({
      shouldFetch: open,
      pageSize: 20,
      query: projectSearch,
    });

  const { options: customerOptions, isLoading: isCustomerLookupLoading } =
    useCustomerLookup({
      shouldFetch: open,
      pageSize: 20,
      query: customerSearch,
    });

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
      const effectiveHoursPerDay = isRecurringEdit
        ? (initialValues?.hoursPerDay ?? value.hoursPerDay)
        : value.hoursPerDay;
      const effectiveFromDate = isLockedAllocationMetadataEdit
        ? (initialValues?.fromDate ?? value.fromDate)
        : value.fromDate;
      const effectiveToDate = isLockedAllocationMetadataEdit
        ? (initialValues?.toDate ?? value.toDate)
        : value.toDate;
      const totalAllocatedHours = computeTotalHours({
        hoursPerDay: effectiveHoursPerDay,
        recurrence: value.recurrence,
        fromDate: effectiveFromDate,
        toDate: effectiveToDate,
        repeatFor: value.repeatFor ?? 0,
        includeWeekends: weekendEntriesAllowed && value.includeWeekends,
      });

      const overrideAwareAllocation =
        initialValues?.allocationStartDate &&
        initialValues?.allocationEndDate &&
        initialValues?.allocationHoursPerDay !== undefined
          ? {
              allocationStartDate: initialValues.allocationStartDate,
              allocationEndDate: initialValues.allocationEndDate,
              allocationHoursPerDay: initialValues.allocationHoursPerDay,
              override: initialValues.override,
            }
          : null;

      const shouldUseOverrideAwareEdit =
        variant === "edit" &&
        !isRecurringEdit &&
        hasExistingOverrides &&
        Boolean(allocationName) &&
        Boolean(
          overrideAwareAllocation &&
          initialValues?.segmentStartDate &&
          initialValues?.segmentEndDate &&
          shouldUseOverrideAwareAllocationEdit({
            ...overrideAwareAllocation,
            startDate: effectiveFromDate,
            endDate: effectiveToDate,
            hoursPerDay: effectiveHoursPerDay,
          }),
        );

      const extendedAllocation =
        shouldUseOverrideAwareEdit && overrideAwareAllocation
          ? extendAllocationRange(overrideAwareAllocation, {
              startDate: effectiveFromDate,
              endDate: effectiveToDate,
            })
          : null;
      const allocationTotalAllocatedHours =
        shouldUseOverrideAwareEdit && extendedAllocation
          ? computeTotalHours({
              hoursPerDay: extendedAllocation.allocationHoursPerDay,
              recurrence: "one-time",
              fromDate: extendedAllocation.allocationStartDate,
              toDate: extendedAllocation.allocationEndDate,
              repeatFor: 0,
              includeWeekends: weekendEntriesAllowed && value.includeWeekends,
            })
          : totalAllocatedHours;
      const segmentEditOverridePatch =
        shouldUseOverrideAwareEdit &&
        extendedAllocation &&
        initialValues?.segmentStartDate &&
        initialValues?.segmentEndDate
          ? buildSegmentEditOverridePatch({
              allocation: extendedAllocation,
              segment: {
                segmentStartDate: initialValues.segmentStartDate,
                segmentEndDate: initialValues.segmentEndDate,
              },
              next: {
                startDate: effectiveFromDate,
                endDate: effectiveToDate,
                hoursPerDay: effectiveHoursPerDay,
              },
            })
          : null;

      setSubmitting(true);

      try {
        const employeeId = isLockedAllocationMetadataEdit
          ? (initialValues?.employeeId ?? value.employeeId)
          : value.employeeId;
        const projectId = isLockedAllocationMetadataEdit
          ? (initialValues?.projectId ?? value.projectId)
          : value.projectId;
        const customer = isLockedAllocationMetadataEdit
          ? (initialValues?.customer ?? value.customer)
          : value.customer;
        const isBillable = isLockedAllocationMetadataEdit
          ? (initialValues?.isBillable ?? value.isBillable)
          : value.isBillable;
        const isTentative = isLockedAllocationMetadataEdit
          ? (initialValues?.isTentative ?? value.isTentative)
          : value.isTentative;

        const payload = {
          allocation: {
            doctype: "Resource Allocation",
            employee: employeeId,
            project: projectId,
            customer: customer,
            allocation_start_date:
              shouldUseOverrideAwareEdit && extendedAllocation
                ? extendedAllocation.allocationStartDate
                : effectiveFromDate,
            allocation_end_date:
              shouldUseOverrideAwareEdit && extendedAllocation
                ? extendedAllocation.allocationEndDate
                : effectiveToDate,
            hours_allocated_per_day:
              shouldUseOverrideAwareEdit && extendedAllocation
                ? extendedAllocation.allocationHoursPerDay
                : effectiveHoursPerDay,
            total_allocated_hours: allocationTotalAllocatedHours,
            is_billable: Number(isBillable),
            status: isTentative ? "Tentative" : "Confirmed",
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
        };

        if (variant === "edit" && allocationName) {
          await editAllocation({
            name: allocationName,
            edit_mode: "only_this",
            ...payload,
            ...(segmentEditOverridePatch
              ? {
                  day_overrides: segmentEditOverridePatch.dayOverrides,
                  deleted_day_overrides:
                    segmentEditOverridePatch.deletedDayOverrides,
                }
              : {}),
          });
        } else {
          await handleAllocation(payload);
        }

        toast.success(
          variant === "edit"
            ? "Allocation updated successfully"
            : "Allocation created successfully",
        );

        closeModal();
        const employeeIds = [
          ...new Set(
            [initialValues?.employeeId, value.employeeId].filter(Boolean),
          ),
        ] as string[];
        const projectIds = [
          ...new Set(
            [initialValues?.projectId, value.projectId].filter(Boolean),
          ),
        ] as string[];
        const refreshTargets = {
          ...(employeeIds.length > 0 ? { employeeIds } : {}),
          ...(projectIds.length > 0 ? { projectIds } : {}),
        };

        await onSuccess?.(
          Object.keys(refreshTargets).length > 0 ? refreshTargets : undefined,
        );
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
    form.reset(mergedDefaultValues);
  }, [form, mergedDefaultValues, onOpenChange]);

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
  const employeeId = useStore(form.store, (state) => state.values.employeeId);

  const overAllocatedDays = useOverAllocation({
    employeeId,
    fromDate,
    toDate,
    hoursPerDay,
    includeWeekends: weekendEntriesAllowed && includeWeekendsValue,
    repeatWeeks: recurrence === "recurring" ? repeatFor : 0,
    allocationName,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(mergedDefaultValues);
  }, [form, mergedDefaultValues, open]);

  useEffect(() => {
    setEmployeeSearch("");
    setProjectSearch("");
    setCustomerSearch("");
  }, [open]);

  const totalHours = computeTotalHours({
    hoursPerDay,
    recurrence,
    fromDate,
    toDate,
    repeatFor,
    includeWeekends: weekendEntriesAllowed && includeWeekendsValue,
  });

  const handleProjectChange = useCallback(
    (value: string | null) => {
      const nextProjectId = value ?? "";
      const selectedProject = projectOptions.find(
        (project) => project.value === nextProjectId,
      );

      form.setFieldValue("projectId", nextProjectId);
      setProjectSearch("");

      if (selectedProject?.customer) {
        form.setFieldValue("customer", selectedProject.customer);
        setCustomerSearch("");
      }
    },
    [form, projectOptions],
  );

  const datesChangedFromSegment =
    fromDate !== (initialValues?.segmentStartDate ?? "") ||
    toDate !== (initialValues?.segmentEndDate ?? "");
  const showOverrideScheduleWarning =
    variant === "edit" &&
    !isRecurringEdit &&
    hasExistingOverrides &&
    datesChangedFromSegment;
  const initialHoursPerDay =
    initialValues?.allocationHoursPerDay ?? initialValues?.hoursPerDay ?? 0;
  const showRecurringHoursResetWarning =
    isRecurringEdit && hoursPerDay !== initialHoursPerDay;

  const employeeField = (
    <form.Field
      name="employeeId"
      children={(field) => (
        <>
          <label className="block text-base text-ink-gray-5 mb-1.5">
            Employee
          </label>
          <Combobox
            inputClassName="bg-white h-8 border-outline-gray-2"
            loading={isEmployeeLookupLoading}
            options={employeeOptions}
            searchValue={employeeSearch}
            placeholder="Select Employee"
            value={field.state.value}
            onChange={(value) => field.handleChange(value as string)}
            onSearchChange={setEmployeeSearch}
            openOnFocus
          />
          {!field.state.meta.isValid && (
            <ErrorMessage message={field.state.meta.errors[0]?.message} />
          )}
        </>
      )}
    />
  );

  const projectField = (
    <form.Field
      name="projectId"
      children={(field) => (
        <>
          <label className="block text-base text-ink-gray-5 mb-1.5">
            Project
          </label>
          <Combobox
            inputClassName="bg-white h-8 border-outline-gray-2"
            loading={isProjectLookupLoading}
            options={projectOptions}
            searchValue={projectSearch}
            placeholder="Select Project"
            value={field.state.value}
            onChange={handleProjectChange}
            onSearchChange={setProjectSearch}
            openOnFocus
          />
          {!field.state.meta.isValid && (
            <ErrorMessage message={field.state.meta.errors[0]?.message} />
          )}
        </>
      )}
    />
  );

  const customerField = (
    <form.Field
      name="customer"
      children={(field) => (
        <>
          <label className="block text-base text-ink-gray-5 mb-1.5">
            Customer
          </label>
          <Combobox
            inputClassName="bg-white h-8 border-outline-gray-2"
            loading={isCustomerLookupLoading}
            options={customerOptions}
            searchValue={customerSearch}
            placeholder="Select Customer"
            value={field.state.value}
            onChange={(value) => {
              field.handleChange(value as string);
              setCustomerSearch("");
            }}
            onSearchChange={setCustomerSearch}
            openOnFocus
          />
          {!field.state.meta.isValid && (
            <ErrorMessage message={field.state.meta.errors[0]?.message} />
          )}
        </>
      )}
    />
  );

  const recurrenceSection =
    variant === "add" ? (
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
    ) : isRecurringEdit ? (
      <div>
        <label className="block text-base text-ink-gray-5 mb-1.5">
          Recurrence
        </label>
        <TabButtons
          value="recurring"
          onChange={() => {}}
          buttons={Object.entries(allocationRecurrenceLabels).map(
            ([value, label]) => ({
              value,
              label,
              disabled: value === "one-time",
            }),
          )}
        />
      </div>
    ) : (
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
                ([value, label]) => ({
                  value,
                  label,
                  disabled: value === "recurring",
                }),
              )}
            />
            {!field.state.meta.isValid && (
              <ErrorMessage message={field.state.meta.errors[0]?.message} />
            )}
          </>
        )}
      />
    );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      options={{
        title: () => (
          <span className="text-lg font-medium">
            {variant === "add" ? "Add Allocation" : "Edit Allocation"}
          </span>
        ),
      }}
      actions={
        <div className="flex items-center justify-between w-full gap-2 -mt-5">
          <div
            className={
              isLockedAllocationMetadataEdit
                ? "w-full pointer-events-none opacity-50"
                : "w-full"
            }
          >
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
          </div>
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
        <div
          className={
            isLockedAllocationMetadataEdit
              ? "pointer-events-none opacity-50 space-y-4"
              : "space-y-4"
          }
        >
          {layoutVariant === "project" ? (
            <>
              {projectField}
              {customerField}
              {employeeField}
            </>
          ) : (
            <>
              {employeeField}
              {projectField}
              {customerField}
            </>
          )}
        </div>

        {recurrenceSection}

        {weekendEntriesAllowed ? (
          <form.Field
            name="includeWeekends"
            children={(field) => (
              <div
                className={
                  isRecurringEdit || hasExistingOverrides
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              >
                <label className="inline-flex items-center gap-2 text-base text-ink-gray-8">
                  <Checkbox
                    value={field.state.value}
                    onChange={(checked) => field.handleChange(Boolean(checked))}
                  />
                  Include weekends
                </label>
              </div>
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
                  <div
                    className={
                      isRecurringEdit || hasExistingOverrides
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  >
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
                  </div>
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
              <div
                className={
                  isRecurringEdit
                    ? "shrink-0 flex flex-1 flex-col gap-1.5 pointer-events-none opacity-50"
                    : "shrink-0 flex flex-1 flex-col gap-1.5"
                }
              >
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

          {(recurrence === "recurring" || isRecurringEdit) && (
            <form.Field
              name="repeatFor"
              children={(field) => (
                <div
                  className={`shrink-0 flex flex-1 flex-col gap-1.5${variant === "edit" ? " pointer-events-none opacity-50" : ""}`}
                >
                  <label className="block text-base text-ink-gray-5">
                    Repeat for
                  </label>
                  <TextInput
                    type="number"
                    size="md"
                    variant="outline"
                    disabled={variant === "edit"}
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

        {showOverrideScheduleWarning && (
          <div className="flex items-center gap-2 bg-(--color-violet-50) rounded-lg px-2.5 py-2">
            <AlertTriangle className="size-4 shrink-0 text-(--color-violet-700)" />
            <p className="flex-1 min-w-0 text-xs text-ink-gray-9 text-left">
              This allocation has a custom per-day schedule that will be
              adjusted to match the new dates.
            </p>
          </div>
        )}

        {showRecurringHoursResetWarning && (
          <div className="flex items-center gap-2 rounded-lg bg-(--color-amber-50) px-2.5 py-2">
            <AlertTriangle className="size-4 shrink-0 text-(--color-amber-700)" />
            <p className="flex-1 min-w-0 text-xs text-ink-gray-9 text-left">
              Changing hours per day clears custom per-day schedules for the
              affected recurring allocation entries.
            </p>
          </div>
        )}

        <OverAllocationWarning overAllocatedDays={overAllocatedDays} />

        <div
          className={
            isLockedAllocationMetadataEdit
              ? "pointer-events-none opacity-50 space-y-4"
              : "space-y-4"
          }
        >
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
      </div>
    </Dialog>
  );
}

export default AddAllocationModal;
