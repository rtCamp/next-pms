/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "@next-pms/design-system/components";
import {
  Button,
  Combobox,
  Dialog,
  ErrorMessage,
  FormLabel,
  Select,
  TextEditor,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { AlertTriangle } from "@rtcamp/frappe-ui-react/icons";
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
import { useEmployeeLookup } from "@/hooks/useEmployeeLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import { RISK_LEVELS, RISK_STATUSES } from "../constants";
import { useRisks } from "../context";
import { EMPTY_RISK_VALUES } from "./constants";
import { DisabledRiskField } from "./disabledRiskField";
import { createRiskSchema, editRiskSchema } from "./schema";
import type { CreateRiskModalProps } from "./types";
import { toRiskOwnerOptions } from "./utils";
import { RiskLevelBadge } from "../riskLevelBadge";
import { RiskStatusBadge } from "../riskStatusBadge";
import type { ApiRiskDetail } from "../types";

export function CreateRiskModal({
  open,
  onClose,
  riskName,
}: CreateRiskModalProps) {
  const projectId = useProjectDetail((s) => s.projectId);
  const projectManagerUserId = useProjectDetail(
    (s) => s.project?.custom_project_manager ?? "",
  );
  const projectManagerName = useProjectDetail(
    (s) => s.project?.custom_project_manager_name ?? "",
  );
  const refreshRisks = useRisks((c) => c.actions.refreshRisks);
  const [submitting, setSubmitting] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toast = useToasts();

  const isEditMode = Boolean(riskName);

  const { createDoc } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();

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

  const riskSchema = useMemo(
    () => (isEditMode ? editRiskSchema : createRiskSchema),
    [isEditMode],
  );

  const form = useForm({
    defaultValues: EMPTY_RISK_VALUES,
    validators: {
      onSubmit: riskSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        if (isEditMode && riskName) {
          await updateDoc("Risk", riskName, {
            ...(value.risk_category !== null
              ? { risk_category: value.risk_category }
              : {}),
            risk_owner: value.risk_owner || "",
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
            ...(value.risk_owner ? { risk_owner: value.risk_owner } : {}),
            ...(value.summary ? { summary: value.summary } : {}),
            ...(value.mitigation_plan
              ? { mitigation_plan: value.mitigation_plan }
              : {}),
          });
        }
        refreshRisks();
        closeModal();
      } catch (err) {
        const message = parseFrappeErrorMsg(err as FrappeError);
        setSubmitError(message);
        toast.error(message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isEditMode && existingRisk) {
      form.setFieldValue("risk_category", existingRisk.risk_category ?? null);
      form.setFieldValue("risk_level", existingRisk.risk_level ?? "");
      form.setFieldValue("status", existingRisk.status ?? "");
      form.setFieldValue("risk_owner", existingRisk.risk_owner ?? "");
      form.setFieldValue("summary", existingRisk.summary ?? "");
      form.setFieldValue("mitigation_plan", existingRisk.mitigation_plan ?? "");
      return;
    }
    if (!isEditMode) {
      form.reset({
        ...EMPTY_RISK_VALUES,
        risk_owner: projectManagerUserId,
      });
    }
  }, [open, isEditMode, existingRisk, projectManagerUserId, form]);

  const closeModal = useCallback(() => {
    onClose();
    setOwnerSearch("");
    setSubmitError(null);
    form.reset(EMPTY_RISK_VALUES);
  }, [form, onClose]);

  const { options: employeeOptions, isLoading: employeesLoading } =
    useEmployeeLookup({
      shouldFetch: open,
      pageSize: 100,
      query: ownerSearch,
    });

  const selectedOwnerLabel = isEditMode
    ? (existingRisk?.risk_owner ?? "")
    : projectManagerName || projectManagerUserId;

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
                  inputClassName="bg-surface-white h-8 border-outline-gray-2 text-ink-gray-7"
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
          {isEditMode ? (
            <DisabledRiskField label="Risk level">
              {existingRisk?.risk_level ? (
                <RiskLevelBadge
                  className="bg-transparent p-0"
                  level={existingRisk.risk_level}
                />
              ) : (
                <span>—</span>
              )}
            </DisabledRiskField>
          ) : (
            <form.Field
              name="risk_level"
              children={(field) => (
                <div className="flex flex-col gap-1.5">
                  <FormLabel size="md" required>
                    Risk level
                  </FormLabel>
                  <Select
                    className="text-ink-gray-7 **:data-placeholder:text-ink-gray-4"
                    variant="outline"
                    options={riskLevelOptions}
                    value={field.state.value}
                    onChange={(val) => field.handleChange(val ?? "")}
                    placeholder="Select level"
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

          {/* Status */}
          {isEditMode ? (
            <DisabledRiskField label="Status">
              {existingRisk?.status ? (
                <RiskStatusBadge
                  className="text-base text-ink-gray-7"
                  status={existingRisk.status}
                />
              ) : (
                <span>—</span>
              )}
            </DisabledRiskField>
          ) : (
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
                    options={statusOptions}
                    value={field.state.value}
                    onChange={(val) => field.handleChange(val ?? "")}
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
          )}

          {isEditMode && (
            <div className="flex items-center gap-2 rounded-lg bg-(--color-violet-50) px-2.5 py-2">
              <AlertTriangle className="size-4 shrink-0 text-(--color-violet-700)" />
              <p className="min-w-0 flex-1 text-left text-xs text-ink-gray-9">
                To change status or risk level, add a new risk update instead.
              </p>
            </div>
          )}

          {/* Risk owner */}
          <form.Field
            name="risk_owner"
            children={(field) => (
              <div className="flex flex-col gap-1.5">
                <label className="block text-base text-ink-gray-5">
                  Risk owner
                </label>
                <Combobox
                  inputClassName="bg-surface-white h-8 border-outline-gray-2 text-ink-gray-7"
                  loading={employeesLoading}
                  options={toRiskOwnerOptions(
                    employeeOptions,
                    field.state.value || undefined,
                    selectedOwnerLabel || undefined,
                  )}
                  placeholder="Select risk owner"
                  searchValue={ownerSearch}
                  onSearchChange={setOwnerSearch}
                  value={field.state.value || null}
                  onChange={(val) => field.handleChange((val as string) ?? "")}
                  openOnFocus
                />
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
                  editorClass="px-2 h-24 prose-sm overflow-auto scrollbar-thin bg-surface-white border rounded-md border-outline-gray-2 text-ink-gray-7"
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
                  editorClass="px-2 h-24 prose-sm overflow-auto scrollbar-thin bg-surface-white border rounded-md border-outline-gray-2 text-ink-gray-7"
                />
              </div>
            )}
          />
          {submitError ? <ErrorMessage message={submitError} /> : null}
        </div>
      )}
    </Dialog>
  );
}
