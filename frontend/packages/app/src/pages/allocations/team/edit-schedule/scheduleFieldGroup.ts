/**
 * External dependencies.
 */
import type { AnyFormApi } from "@tanstack/form-core";
import { useFieldGroup } from "@tanstack/react-form";

export const useScheduleFieldGroup = (form: AnyFormApi) =>
  useFieldGroup({
    form,
    fields: "schedule",
    formComponents: {},
  } as never);

export type ScheduleFieldGroupApi = ReturnType<typeof useScheduleFieldGroup>;
