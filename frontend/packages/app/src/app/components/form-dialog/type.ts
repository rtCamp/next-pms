import { z } from "zod";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FieldProps {
  label: string;
  name: string;
  placeholder: string;
  value: string | string[] | number | number[];
  data?: FieldData[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type: "text" | "text-area" | "search" | "custom";
  customComponent?: React.FC;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  numberColsWidth?: number;
}

export interface FieldData {
  label: string;
  value: string;
}

export interface ButtonProps {
  label: string;
  disabled?: boolean;
  Icon?: React.FC;
  onClick?: () => void;
  variant?:
    | "default"
    | "destructive"
    | "success"
    | "warning"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null
    | undefined;
  type: "submit" | "default";
}

export interface FormObjectProps {
  schema: any;
  defaultValues: any;
  mode: any;
}

export interface DialogObjectProps {
  open: boolean;
  onOpenChange: () => void;
  title: string;
  ariaDescription?: string;
  ariaDescribedby?: string;
  titleClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  footerButtonClassName?: string;
}

export interface FormDialogProps {
  fields: FieldProps[][];
  butttons: ButtonProps[];
  formObject: FormObjectProps;
  dialogObject: DialogObjectProps;
  onSubmit: (data: z.infer<any>) => void;
  onClose: () => void;
}
