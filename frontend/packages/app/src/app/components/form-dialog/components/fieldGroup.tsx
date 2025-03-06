/**
 * Internal dependencies.
 */
import { FieldProps } from "../type";
import { FormDialogField } from "./field";
import { FormDialogFieldGroupProps } from "./type";

const FormDialogFieldGroup = ({ fields, form }: FormDialogFieldGroupProps) => {
  return (
    <div className="flex flex-col gap-y-2">
      {fields.map((fieldItems: FieldProps[], index: number) => {
        return (
          <div key={index} className="grid max-sm:grid-rows-2 sm:grid-cols-12 gap-3">
            {fieldItems.map((field, index) => {
              return <FormDialogField key={index} dialogField={field} form={form} />;
            })}
          </div>
        );
      })}
    </div>
  );
};

export { FormDialogFieldGroup };
