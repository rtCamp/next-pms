/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import {
  Button,
  Combobox,
  Dialog,
  ErrorMessage,
  FormLabel,
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
import { useCustomerLookup } from "@/hooks/useCustomerLookup";
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
  const [customerSearch, setCustomerSearch] = useState("");
  const [submitError, setSubmitError] = useState("");

  const toast = useToasts();
  const { createDoc, loading } = useFrappeCreateDoc();

  const form = useForm({
    defaultValues: {
      projectName: prefill?.projectName ?? "",
      phase: prefill?.phase ?? "Delivery Prep",
      company: prefill?.company ?? "",
      customer: prefill?.customer ?? "",
    },
    validators: {
      onSubmit: addProjectFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError("");
      try {
        const doc = await createDoc("Project", {
          naming_series: "PROJ-.####",
          project_name: value.projectName,
          custom_project_phase: value.phase,
          company: value.company || undefined,
          customer: value.customer,
        });
        toast.success("Project created successfully");
        onSuccess?.(doc as { name: string } & Record<string, unknown>);
        closeModal();
      } catch (err) {
        setSubmitError(parseFrappeErrorMsg(err as FrappeError));
      }
    },
  });

  const { options: companyOptions, isLoading: isCompanyLoading } =
    useCompanyLookup({
      shouldFetch: open,
      query: companySearch,
    });

  const { options: customerOptions, isLoading: isCustomerLoading } =
    useCustomerLookup({
      shouldFetch: open,
      query: customerSearch,
    });

  const closeModal = useCallback(() => {
    setCompanySearch("");
    setCustomerSearch("");
    setSubmitError("");
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
      className="my-0"
      classNames={{
        header: "mb-5",
        content: "pt-5 pb-2",
        viewport: "justify-start pt-30",
        footer: "pb-6",
      }}
      actions={
        <div className="flex items-center justify-end w-full gap-2">
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
      <div className="space-y-4">
        <form.Field
          name="projectName"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Project
              </FormLabel>
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
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Phase
              </FormLabel>
              <Select
                className="h-8"
                variant="outline"
                options={PHASE_SELECT_OPTIONS}
                placeholder="Select phase"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value as string)}
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
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Company
              </FormLabel>
              <Combobox
                inputClassName="bg-surface-white h-8 border-outline-gray-2"
                loading={isCompanyLoading}
                options={companyOptions}
                placeholder="Select company"
                searchValue={companySearch}
                onSearchChange={setCompanySearch}
                value={field.state.value || null}
                onChange={(value) => field.handleChange(value ?? "")}
                openOnFocus
                tooltipOnTruncate
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="customer"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <FormLabel size="md" required>
                Customer
              </FormLabel>
              <Combobox
                inputClassName="bg-surface-white h-8 border-outline-gray-2"
                loading={isCustomerLoading}
                options={customerOptions}
                placeholder="Select customer"
                searchValue={customerSearch}
                onSearchChange={setCustomerSearch}
                value={field.state.value || null}
                onChange={(value) => field.handleChange(value ?? "")}
                openOnFocus
                tooltipOnTruncate
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <ErrorMessage message={submitError} />
      </div>
    </Dialog>
  );
}

export default AddProjectModal;
