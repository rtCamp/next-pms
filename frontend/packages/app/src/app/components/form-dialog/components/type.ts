/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Internal dependencies.
 */
import { FieldProps } from "../type";

export interface FormDialogFieldGroupProps {
  fields: FieldProps[][];
  form: any;
}

export interface FormDialogFieldProps {
  form: any;
  dialogField: FieldProps;
}

export interface FormDialogInputProps extends FormDialogFieldProps {
  formField: any;
}
