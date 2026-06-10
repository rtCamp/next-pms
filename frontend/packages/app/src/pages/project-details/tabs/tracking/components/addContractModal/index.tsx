/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
import { getTodayDate } from "@next-pms/design-system/date";
import {
  Button,
  Combobox,
  DatePicker,
  Dialog,
  ErrorMessage,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import { FrappeError } from "frappe-react-sdk";
import { Calendar } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useSalesInvoiceLookup } from "@/hooks/useSalesInvoiceLookup";
import { useSalesOrderLookup } from "@/hooks/useSalesOrderLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { addContractSchema } from "./schema";
import type { AddContractFormValues, AddContractModalProps } from "./types";

const defaultValues: AddContractFormValues = {
  startDate: getTodayDate(),
  endDate: getTodayDate(),
  hoursBought: "",
  salesOrder: "",
  salesInvoice: "",
};

export function AddContractModal({
  open,
  onOpenChange,
  onSubmit,
  projectId,
}: AddContractModalProps) {
  const toast = useToasts();
  const [salesOrderSearch, setSalesOrderSearch] = useState("");
  const [salesInvoiceSearch, setSalesInvoiceSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: addContractSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitting(true);
      try {
        await onSubmit({
          startDate: value.startDate,
          endDate: value.endDate,
          hoursBought: Number(value.hoursBought),
          salesOrder: value.salesOrder || undefined,
          salesInvoice: value.salesInvoice || undefined,
        });
        toast.success("Contract added successfully");
        onOpenChange(false);
        form.reset();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { options: salesOrderOptions, isLoading: isSalesOrderLookupLoading } =
    useSalesOrderLookup({
      shouldFetch: open,
      pageSize: 20,
      query: salesOrderSearch,
      projectId,
    });

  const {
    options: salesInvoiceOptions,
    isLoading: isSalesInvoiceLookupLoading,
  } = useSalesInvoiceLookup({
    shouldFetch: open,
    pageSize: 20,
    query: salesInvoiceSearch,
    projectId,
  });

  useEffect(() => {
    if (!open) {
      form.reset();
      setSalesOrderSearch("");
      setSalesInvoiceSearch("");
    }
  }, [open, form]);

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
      options={{ title: "Add contract", size: "sm" }}
      actions={
        <Button
          className="w-full h-7"
          variant="solid"
          label="Add contract"
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
                      className="w-full flex justify-between gap-2 shrink-0 cursor-pointer"
                      iconRight={() => <Calendar className="size-4 shrink-0" />}
                    >
                      <span className="text-lg whitespace-nowrap mr-2">
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
                      className="w-full justify-between gap-2 shrink-0 cursor-pointer"
                      iconRight={() => <Calendar className="size-4 shrink-0" />}
                    >
                      <span className="text-lg whitespace-nowrap mr-2">
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
          name="salesOrder"
          children={(field) => (
            <div className="flex flex-col gap-1.5">
              <label className="block text-base text-ink-gray-5">
                Sales order
              </label>
              <Combobox
                inputClassName="bg-white h-8 border-outline-gray-2"
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
                inputClassName="bg-white h-8 border-outline-gray-2"
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

export default AddContractModal;
