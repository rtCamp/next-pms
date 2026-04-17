/**
 * External dependencies.
 */
import { DurationInput } from "@next-pms/design-system/components";
import { formatDateRange, getTodayDate } from "@next-pms/design-system/date";
import {
  Button,
  Checkbox,
  Combobox,
  DateRangePicker,
  Dialog,
  TabButtons,
  Textarea,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm, useStore } from "@tanstack/react-form";
import { Calendar } from "lucide-react";

/**
 * Internal dependencies.
 */
import {
  ALLOCATION_RECURRENCE_LABELS,
  EMPLOYEE_OPTIONS,
  PROJECT_OPTIONS,
} from "./constants";
import { type AddAllocationModalProps } from "./types";

function AddAllocationModal({ open, onOpenChange }: AddAllocationModalProps) {
  const toast = useToasts();

  const defaultValues: {
    employeeId: string;
    projectId: string;
    recurrence: string;
    includeWeekends: boolean;
    fromDate: string;
    toDate: string;
    hoursPerDay: number;
    repeatFor: number;
    isBillable: boolean;
    isTentative: boolean;
    note: string;
  } = {
    employeeId: EMPLOYEE_OPTIONS[0]?.value ?? "",
    projectId: PROJECT_OPTIONS[0]?.value ?? "",
    recurrence: "one-time",
    includeWeekends: true,
    fromDate: getTodayDate(),
    toDate: getTodayDate(),
    hoursPerDay: 3.5,
    repeatFor: 56,
    isBillable: true,
    isTentative: false,
    note: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      void value;
      toast.success("Allocation created (static mode)");
      onOpenChange(false);
      form.reset();
    },
  });

  const recurrence = useStore(form.store, (state) => state.values.recurrence);
  const hoursPerDay = useStore(form.store, (state) => state.values.hoursPerDay);
  const repeatFor = useStore(
    form.store,
    (state) => state.values.repeatFor ?? 1,
  );
  const totalHours = Math.round(
    hoursPerDay * (recurrence === "recurring" ? repeatFor : 16),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          form.reset();
        }
      }}
      options={{
        title: () => (
          <span className="text-lg font-medium">Add allocation</span>
        ),
      }}
      actions={
        <div className="flex items-center justify-between gap-2 w-full -mt-5">
          <form.Field
            name="isTentative"
            children={(field) => (
              <label className="shrink-0 inline-flex items-center gap-2 text-base text-ink-gray-6">
                <Checkbox
                  value={field.state.value}
                  onChange={(checked) => field.handleChange(Boolean(checked))}
                />
                Mark as tentative
              </label>
            )}
          />
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="ghost"
              label="Cancel"
              onClick={() => onOpenChange(false)}
            />
            <Button
              variant="solid"
              label="Allocate"
              onClick={() => form.handleSubmit()}
            />
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <form.Field
          name="employeeId"
          children={(field) => (
            <>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Employee
              </label>
              <Combobox
                inputClassName="bg-white h-8 border-outline-gray-2"
                options={EMPLOYEE_OPTIONS}
                value={field.state.value}
                onChange={(value) => field.handleChange(value as string)}
                openOnFocus
              />
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
                options={PROJECT_OPTIONS}
                value={field.state.value}
                onChange={(value) => field.handleChange(value as string)}
                openOnFocus
              />
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
                onChange={(value) => field.handleChange(value)}
                buttons={Object.entries(ALLOCATION_RECURRENCE_LABELS).map(
                  ([value, label]) => ({ value, label }),
                )}
              />
            </>
          )}
        />

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

        <form.Field
          name="fromDate"
          children={(fromField) => (
            <form.Field
              name="toDate"
              children={(toField) => (
                <div className="flex w-full flex-col gap-1.5">
                  <label className="block text-base text-ink-gray-5">
                    Start and end date
                  </label>
                  <DateRangePicker
                    value={[fromField.state.value, toField.state.value]}
                    onChange={(value) => {
                      const nextFrom = value?.[0] ?? "";
                      const nextTo = value?.[1] ?? "";
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
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
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
              <span className="inline-block size-1 rounded-full bg-surface-amber-3" />
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
