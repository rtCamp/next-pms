/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@next-pms/design-system/components";
import {
  Button,
  Combobox,
  Dialog,
  ErrorMessage,
  Select,
  TextEditor,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import {
  FrappeError,
  useFrappeCreateDoc,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import { RISK_STATUSES } from "../constants";
import { useRisks } from "../context";
import { createRiskSchema } from "./schema";
import type { CreateRiskModalProps } from "./types";
import { RiskLevelBadge } from "../riskLevelBadge";
import { RiskStatusBadge } from "../riskStatusBadge";
import type { ApiRiskDetail } from "../types";

const RISK_LEVELS = ["Low", "Medium", "High"] as const;

const emptyValues = {
  risk_category: null as string | null,
  risk_level: "",
  status: "",
  summary: "",
  mitigation_plan: "",
};

export function CreateRiskModal({
  open,
  onClose,
  riskName,
  initialStatus,
}: CreateRiskModalProps) {
  const defaultState = { ...emptyValues };
  if (initialStatus) {
    defaultState.status = initialStatus;
  }

  const projectId = useProjectDetail((s) => s.projectId);
  const refreshRisks = useRisks((c) => c.actions.refreshRisks);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToasts();

  const isEditMode = Boolean(riskName);

  const { createDoc } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();

  // Fetch existing risk only in edit mode (null swrKey disables fetching)
  const {
    data: existingRisk,
    isLoading: existingRiskLoading,
    mutate: mutateRiskDetail,
  } = useFrappeGetDoc<ApiRiskDetail>(
    "Risk",
    riskName ?? "",
    riskName ? undefined : null,
  );

  const { data: categories, isLoading: categoriesLoading } =
    useFrappeGetDocList<{ name: string }>("Risk Category", {
      fields: ["name"],
      limit: 100,
      orderBy: { field: "name", order: "asc" },
    });

  const categoryOptions = (categories ?? []).map((c) => ({
    label: c.name,
    value: c.name,
  }));

  const riskLevelOptions = RISK_LEVELS.map((l) => ({
    label: (
      <RiskLevelBadge className="bg-transparent p-0" level={l} />
    ) as unknown as string,
    value: l,
  }));
  const statusOptions = RISK_STATUSES.map((s) => ({
    label: (
      <RiskStatusBadge className="bg-transparent p-0" status={s} />
    ) as unknown as string,
    value: s,
  }));

  const form = useForm({
    defaultValues: defaultState,
    validators: {
      onSubmit: createRiskSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        if (isEditMode && riskName) {
          await updateDoc("Risk", riskName, {
            ...(value.risk_category !== null
              ? { risk_category: value.risk_category }
              : {}),
            risk_level: value.risk_level,
            status: value.status,
            ...(value.summary ? { summary: value.summary } : {}),
            ...(value.mitigation_plan
              ? { mitigation_plan: value.mitigation_plan }
              : {}),
          });
          void mutateRiskDetail();
        } else {
          await createDoc("Risk", {
            project: projectId,
            ...(value.risk_category
              ? { risk_category: value.risk_category }
              : {}),
            risk_level: value.risk_level,
            status: value.status,
            ...(value.summary ? { summary: value.summary } : {}),
            ...(value.mitigation_plan
              ? { mitigation_plan: value.mitigation_plan }
              : {}),
          });
        }
        refreshRisks();
        closeModal();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Pre-fill form when editing an existing risk
  useEffect(() => {
    if (open && isEditMode && existingRisk) {
      form.reset({
        risk_category: existingRisk.risk_category ?? null,
        risk_level: existingRisk.risk_level ?? "",
        status: existingRisk.status ?? "",
        summary: existingRisk.summary ?? "",
        mitigation_plan: existingRisk.mitigation_plan ?? "",
      });
    }
  }, [open, isEditMode, existingRisk, toast, form]);

  const closeModal = useCallback(() => {
    onClose();
    form.reset(emptyValues);
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
        content: "pt-5 pb-4",
        footer: "pb-6",
      }}
      options={{ title: isEditMode ? "Edit risk" : "Create risk", size: "md" }}
      actions={
        <Button
          className="w-full h-7"
          variant="solid"
          label={isEditMode ? "Save" : "Create"}
          onClick={() => form.handleSubmit()}
          disabled={submitting || existingRiskLoading || categoriesLoading}
          loading={submitting}
        />
      }
    >
      {isEditMode && existingRiskLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="-mt-2 space-y-4">
          {/* Risk category */}
          <form.Field
            name="risk_category"
            children={(field) => (
              <div className="flex flex-col gap-1.5">
                <label className="block text-base text-ink-gray-5">
                  Risk category
                </label>
                <Combobox
                  inputClassName="bg-white h-8 border-outline-gray-2 text-ink-gray-7"
                  loading={categoriesLoading}
                  options={categoryOptions}
                  placeholder="Select category"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val)}
                  openOnFocus
                />
              </div>
            )}
          />

          {/* Risk level */}
          <form.Field
            name="risk_level"
            children={(field) => (
              <div className="flex flex-col gap-1.5">
                <label className="block text-base text-ink-gray-5">
                  Risk level
                </label>
                <Select
                  className="text-ink-gray-7 **:data-placeholder:text-ink-gray-4"
                  variant="outline"
                  options={riskLevelOptions}
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val ?? "")}
                  placeholder="Select level"
                />
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />

          {/* Status */}
          <form.Field
            name="status"
            children={(field) => (
              <div className="flex flex-col gap-1.5">
                <label className="block text-base text-ink-gray-5">
                  Status
                </label>
                <Select
                  className="text-ink-gray-7 **:data-placeholder:text-ink-gray-4"
                  variant="outline"
                  options={statusOptions}
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val ?? "")}
                  placeholder="Select status"
                />
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />

          {/* Summary */}
          <form.Field
            name="summary"
            children={(field) => (
              <div className="flex flex-col gap-1.5">
                <label className="block text-base text-ink-gray-5">
                  Summary
                </label>
                <TextEditor
                  placeholder="Describe the risk..."
                  content={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  fixedMenu={false}
                  editorClass="px-2 h-24 prose-sm overflow-auto scrollbar-thin bg-white border rounded-md border-outline-gray-2 text-ink-gray-7"
                />
              </div>
            )}
          />

          {/* Mitigation Plan */}
          <form.Field
            name="mitigation_plan"
            children={(field) => (
              <div className="flex flex-col gap-1.5">
                <label className="block text-base text-ink-gray-5">
                  Mitigation plan
                </label>
                <TextEditor
                  placeholder="Describe the mitigation plan..."
                  content={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  fixedMenu={false}
                  editorClass="px-2 h-24 prose-sm overflow-auto scrollbar-thin bg-white border rounded-md border-outline-gray-2 text-ink-gray-7"
                />
              </div>
            )}
          />
        </div>
      )}
    </Dialog>
  );
}
