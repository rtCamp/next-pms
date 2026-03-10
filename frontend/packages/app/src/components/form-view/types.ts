import React from "react";

export type Field = {
  fieldtype: string;
  label?: string;
  value?: string | number | ChildRow[] | null;
  reqd?: string | number;
  read_only?: string | number;
  options?: string;
  description?: string | null;
  fieldname: string;
  depends_on: string;
  link?: {
    doctype: string;
    name: string;
    route: string;
  };
  hidden: number;
  child_meta?: ChildMetaField[];
};

export type Section = {
  title: string;
  columns: Field[][];
};

export type FieldConfigType = Record<string, Record<string, boolean>>;

export interface ChildMetaField {
  label: string | null;
  fieldname: string;
  fieldtype: string;
  in_list_view: number;
  read_only: number;
  reqd: number;
  options: string;
  parentfield: string;
}

export interface ChildRow {
  idx: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type CustomTab = {
  component: React.ReactNode;
  isCustom: boolean;
};
