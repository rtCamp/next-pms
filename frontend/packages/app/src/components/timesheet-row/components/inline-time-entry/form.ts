/**
 * External dependencies
 */
import { useForm } from "@tanstack/react-form";

/**
 * Internal dependencies
 */
import { inlineTimeEntryValues } from "./schema";
import type { TimeEntryFormValues } from "./types";

type UseInlineTimeEntryFormArgs = {
  defaultValues: TimeEntryFormValues;
  onSubmit: (args: { value: TimeEntryFormValues }) => Promise<void>;
};

/**
 * A custom hook that initializes and manages the state of the inline time entry form.
 * @param args An object containing the default values for the form and a callback function to handle form submission.
 * @returns An instance of the form API, which includes methods and properties to interact with the form state and handle form actions.
 */
export const useInlineTimeEntryForm = ({
  defaultValues,
  onSubmit,
}: UseInlineTimeEntryFormArgs) => {
  return useForm({
    defaultValues,
    validators: {
      onSubmit: inlineTimeEntryValues,
    },
    onSubmit,
  });
};

export type TimeEntryFormApi = ReturnType<typeof useInlineTimeEntryForm>;
