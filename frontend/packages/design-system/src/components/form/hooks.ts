/**
 * External dependencies.
 */
import * as React from "react";
/**
 * Internal dependencies.
 */
import { useFormContext } from "react-hook-form";
import { FormFieldContextValue, FormItemContextValue } from "./type";

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

export { FormFieldContext, FormItemContext, useFormField };
