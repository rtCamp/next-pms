/**
 * External dependencies.
 */
import {
  ComboBox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  TextArea,
} from "@next-pms/design-system/components";
import { cn } from "@next-pms/design-system/utils";
import { Search } from "lucide-react";

/**
 * Internal dependencies.
 */
import { FormDialogFieldProps, FormDialogInputProps } from "./type";

export const FormDialogField = ({ dialogField, form }: FormDialogFieldProps) => {
  return (
    <FormField
      control={form.control}
      name={dialogField.name}
      render={({ field }) => (
        <FormItem className={cn("sm:col-span-4", dialogField.className)}>
          <FormLabel className="flex gap-2 items-center">
            <p title={dialogField.name} className="text-sm truncate">
              {dialogField.label}
            </p>
          </FormLabel>
          <FormControl>
            <FormDialogInput dialogField={dialogField} formField={field} form={form}></FormDialogInput>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export const FormDialogInput = ({ dialogField, formField, form }: FormDialogInputProps) => {
  const onChange = (value: string | number | undefined) => {
    form.setValue(dialogField.name, value);
  };

  if (dialogField.type == "text") {
    return (
      <div className="relative flex items-center">
        <Input
          placeholder={dialogField.placeholder}
          className="placeholder:text-slate-400 placeholder:text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
          {...formField}
          type="text"
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
      </div>
    );
  }

  if (dialogField.type == "text-area") {
    return (
      <div className="relative flex items-center">
        <TextArea
          placeholder={dialogField.placeholder}
          rows={4}
          className="w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          {...formField}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
      </div>
    );
  }

  if (dialogField.type == "search") {
    return (
      <ComboBox
        label="Search Project"
        showSelected
        shouldFilter
        value={form.getValues(dialogField.name) ? [form.getValues(dialogField.name)] : []}
        data={dialogField.data ? dialogField.data : []}
        onSelect={(data: string[] | string) => {
          onChange(data[0]);
        }}
        rightIcon={<Search className="tasksstroke-slate-400"></Search>}
      />
    );
  }
};
