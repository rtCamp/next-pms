/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import {
  Button,
  Combobox,
  Dialog,
  ErrorMessage,
  Select,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import { FrappeError, useFrappeCreateDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useCompanyLookup } from "@/hooks/useCompanyLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { addProjectFormSchema } from "./schema";
import type { AddProjectModalProps } from "./types";
import { PHASE_OPTIONS } from "../../constants";

const PHASE_SELECT_OPTIONS = PHASE_OPTIONS.filter((o) => o.value !== "");

function AddProjectModal({
  open,
  onOpenChange,
  prefill,
  onSuccess,
}: AddProjectModalProps) {
  const [companySearch, setCompanySearch] = useState("");

  const toast = useToasts();
  const { createDoc, loading } = useFrappeCreateDoc();

  const form = useForm({
    defaultValues: {
      projectName: prefill?.projectName ?? "",
      phase: prefill?.phase ?? "Delivery Prep",
      company: prefill?.company ?? "",
    },
    validators: {
      onSubmit: addProjectFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const doc = await createDoc("Project", {
          naming_series: "PROJ-.####",
          project_name: value.projectName,
          custom_project_phase: value.phase,
          company: value.company || undefined,
        });
        toast.success("Project created successfully");
        onSuccess?.(doc as { name: string } & Record<string, unknown>);
        closeModal();
      } catch (err) {
        const error = parseFrappeErrorMsg(err as FrappeError);
        toast.error(error);
      }
    },
  });

  const { options: companyOptions, isLoading: isCompanyLoading } =
    useCompanyLookup({
      shouldFetch: open,
      query: companySearch,
    });

  const closeModal = useCallback(() => {
    setCompanySearch("");
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

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      options={{
        title: () => <span className="text-lg font-medium">Add Project</span>,
      }}
      actions={
        <div className="flex items-center justify-end w-full gap-2 -mt-5">
          <Button variant="ghost" label="Cancel" onClick={closeModal} />
          <Button
            variant="solid"
            label="Add Project"
            onClick={() => form.handleSubmit()}
            disabled={loading}
            loading={loading}
          />
        </div>
      }
    >
      <div className="-mt-2 space-y-4">
        <form.Field
          name="projectName"
          children={(field) => (
            <div>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Project
              </label>
              <TextInput
                size="md"
                variant="outline"
                placeholder="Project Name"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="phase"
          children={(field) => (
            <div>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Phase
              </label>
              <Select
                className="h-8"
                variant="outline"
                options={PHASE_SELECT_OPTIONS}
                placeholder="Select phase"
                value={field.state.value}
                onChange={(value) => field.handleChange(value as string)}
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="company"
          children={(field) => (
            <div>
              <label className="block text-base text-ink-gray-5 mb-1.5">
                Company
              </label>
              <Combobox
                inputClassName="bg-white h-8 border-outline-gray-2"
                loading={isCompanyLoading}
                options={companyOptions}
                placeholder="Select company"
                searchValue={companySearch}
                onSearchChange={setCompanySearch}
                value={field.state.value || null}
                onChange={(value) => field.handleChange(value ?? "")}
                openOnFocus
              />
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

export default AddProjectModal;
