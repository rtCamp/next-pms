/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { getTodayDate } from "@next-pms/design-system/date";
import {
  Button,
  Combobox,
  DatePicker,
  Dialog,
  ErrorMessage,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { Calendar } from "@rtcamp/frappe-ui-react/icons";
import { useForm } from "@tanstack/react-form";

/**
 * Internal dependencies.
 */
import { useSalesInvoiceLookup } from "@/hooks/useSalesInvoiceLookup";
import { useSalesOrderLookup } from "@/hooks/useSalesOrderLookup";
import { useProjectDetail } from "@/pages/project-details/context";
import { addContractSchema } from "./schema";
import type { ContractFormValues, ContractModalProps } from "./types";

const FALLBACK_DEFAULTS: ContractFormValues = {
  startDate: getTodayDate(),
  endDate: getTodayDate(),
  hoursBought: "",
  salesOrder: "",
  salesInvoice: "",
};

export function ContractModal({
  open,
  onOpenChange,
  onSubmit,
  mode = "add",
  initialValues,
}: ContractModalProps) {
  const [salesOrderSearch, setSalesOrderSearch] = useState("");
  const [salesInvoiceSearch, setSalesInvoiceSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const customer = useProjectDetail((state) => state.project?.customer);

  const isEdit = mode === "edit";
  const title = isEdit ? "Edit contract" : "Add contract";
  const submitLabel = isEdit ? "Save changes" : "Add contract";

  const form = useForm({
    defaultValues: {
      ...FALLBACK_DEFAULTS,
      ...initialValues,
    },
    validators: {
      onSubmit: addContractSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      await onSubmit({
        startDate: value.startDate,
        endDate: value.endDate,
        hoursBought: Number(value.hoursBought),
        salesOrder: value.salesOrder || undefined,
        salesInvoice: value.salesInvoice || undefined,
      });
      onOpenChange(false);
      form.reset();
      setSubmitting(false);
    },
  });

  const { options: salesOrderOptions, isLoading: isSalesOrderLookupLoading } =
    useSalesOrderLookup({
      shouldFetch: open,
      pageSize: 20,
      query: salesOrderSearch,
      filters: [["Sales Order", "customer", "=", customer || ""]],
    });

  const {
    options: salesInvoiceOptions,
    isLoading: isSalesInvoiceLookupLoading,
  } = useSalesInvoiceLookup({
    shouldFetch: open,
    pageSize: 20,
    query: salesInvoiceSearch,
    filters: [["Sales Invoice", "customer", "=", customer || ""]],
  });

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        form.reset({
          ...FALLBACK_DEFAULTS,
          ...initialValues,
        });
      } else {
        form.reset();
        setSalesOrderSearch("");
        setSalesInvoiceSearch("");
      }
      onOpenChange(next);
    },
    [form, initialValues, onOpenChange],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      className="my-0"
      classNames={{
        header: "mb-5",
        content: "pt-5 pb-2",
        viewport: "justify-start pt-30",
        footer: "pb-6",
      }}
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
        <div className="w-full flex gap-4">
          <form.Field
            name="startDate"
            children={(field) => (
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="block text-base text-ink-gray-5">
                  Start date
                </label>
                <DatePicker
                  label="Start date"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val as string)}
                  placeholder="Select date"
                >
                  {({ displayValue }) => (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex justify-between gap-2 shrink-0 cursor-pointer text-ink-gray-7"
                      iconRight={() => <Calendar className="size-4 shrink-0" />}
                    >
                      <span className="whitespace-nowrap mr-2">
                        {displayValue}
                      </span>
                    </Button>
                  )}
                </DatePicker>
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />

          <form.Field
            name="endDate"
            children={(field) => (
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="block text-base text-ink-gray-5">
                  End date
                </label>
                <DatePicker
                  label="End date"
                  value={field.state.value}
                  onChange={(val) => field.handleChange(val as string)}
                  placeholder="Select date"
                >
                  {({ displayValue }) => (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between gap-2 shrink-0 cursor-pointer text-ink-gray-7"
                      iconRight={() => <Calendar className="size-4 shrink-0" />}
                    >
                      <span className="whitespace-nowrap mr-2">
                        {displayValue}
                      </span>
                    </Button>
                  )}
                </DatePicker>
                {!field.state.meta.isValid && (
                  <ErrorMessage message={field.state.meta.errors[0]?.message} />
                )}
              </div>
            )}
          />
        </div>

        <form.Field
          name="hoursBought"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Hours bought
              </label>
              <TextInput
                size="md"
                variant="outline"
                type="number"
                placeholder="Enter hours"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="bg-white border-outline-gray-2 text-ink-gray-7"
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
          name="salesOrder"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Sales order
              </label>
              <Combobox
                inputClassName="bg-white h-8 border-outline-gray-2 text-ink-gray-7"
                loading={isSalesOrderLookupLoading}
                options={salesOrderOptions}
                searchValue={salesOrderSearch}
                placeholder="Select sales order"
                value={field.state.value}
                onChange={(value) => field.handleChange(value as string)}
                onSearchChange={setSalesOrderSearch}
                openOnFocus
              />
              {!field.state.meta.isValid && (
                <ErrorMessage message={field.state.meta.errors[0]?.message} />
              )}
            </div>
          )}
        />

        <form.Field
          name="salesInvoice"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Sales invoice
              </label>
              <Combobox
                inputClassName="bg-white h-8 border-outline-gray-2 text-ink-gray-7"
                loading={isSalesInvoiceLookupLoading}
                options={salesInvoiceOptions}
                searchValue={salesInvoiceSearch}
                placeholder="Select sales invoice"
                value={field.state.value}
                onChange={(value) => field.handleChange(value as string)}
                onSearchChange={setSalesInvoiceSearch}
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

export default ContractModal;
