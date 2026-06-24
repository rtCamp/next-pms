/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getTodayDate } from "@next-pms/design-system/date";
import {
  Avatar,
  Button,
  Combobox,
  DatePicker,
  Dialog,
  ErrorMessage,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import { Calendar } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useEmployeeLookup } from "@/hooks/useEmployeeLookup";
import { useProjectDetail } from "@/pages/project-details/context";
import { addProjectRateSchema } from "./schema";
import type { ProjectRateFormValues, ProjectRateModalProps } from "./types";

const FALLBACK_DEFAULTS: ProjectRateFormValues = {
  employee: "",
  hourlyRate: "",
  validFrom: getTodayDate(),
};

export function ProjectRateModal({
  open,
  onOpenChange,
  onSubmit,
  mode = "add",
  initialValues,
}: ProjectRateModalProps) {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const projectId = useProjectDetail((s) => s.projectId);

  const isEdit = mode === "edit";
  const title = isEdit ? "Edit project rate" : "Add project rate";
  const submitLabel = isEdit ? "Save changes" : "Add rate";

  const defaultValues = useMemo<ProjectRateFormValues>(
    () => ({ ...FALLBACK_DEFAULTS, ...initialValues }),
    [initialValues],
  );

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: addProjectRateSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      await onSubmit({
        employee: value.employee,
        hourlyRate: Number(value.hourlyRate),
        validFrom: value.validFrom,
      });
      onOpenChange(false);
      form.reset();
      setSubmitting(false);
    },
  });

  const { options: employeeOptions, isLoading: isEmployeeLookupLoading } =
    useEmployeeLookup({
      shouldFetch: open,
      pageSize: 20,
      query: employeeSearch,
      projects: [projectId],
    });

  const employeeOptionsWithAvatars = useMemo(
    () =>
      employeeOptions.map((opt) => ({
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
    [employeeOptions],
  );

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    } else {
      form.reset();
      setEmployeeSearch("");
    }
  }, [open, form, defaultValues]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
    },
    [onOpenChange],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      options={{ title, size: "sm" }}
      actions={
        <Button
          className="w-full h-7"
          variant="solid"
          label={submitLabel}
          onClick={() => form.handleSubmit()}
          disabled={submitting}
          loading={submitting}
        />
      }
    >
      <div className="-mt-2 space-y-4">
        <form.Field
          name="employee"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">Member</label>
              <Combobox
                inputClassName="bg-white h-8 border-outline-gray-2"
                loading={isEmployeeLookupLoading}
                options={employeeOptionsWithAvatars}
                searchValue={employeeSearch}
                placeholder="Select member"
                value={field.state.value}
                onChange={(value) => field.handleChange(value as string)}
                onSearchChange={setEmployeeSearch}
                openOnFocus
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="hourlyRate"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Hourly rate
              </label>
              <TextInput
                size="md"
                variant="outline"
                type="number"
                placeholder="0"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="bg-white border-outline-gray-2"
                suffix={() => (
                  <span className="pr-2 text-[13px] text-ink-gray-5">/h</span>
                )}
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="validFrom"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Valid from
              </label>
              <DatePicker
                label="Valid from"
                value={field.state.value}
                onChange={(val) => field.handleChange(val as string)}
                placeholder="Select date"
              >
                {({ displayValue }) => (
                  <div className="flex relative items-center py-1 w-full rounded-lg border border-outline-gray-2 px-2.5">
                    <input
                      readOnly
                      type="text"
                      value={displayValue}
                      className="flex-1"
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
      </div>
    </Dialog>
  );
}

export default ProjectRateModal;
