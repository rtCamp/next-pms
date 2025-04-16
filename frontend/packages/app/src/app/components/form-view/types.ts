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
  left: Field[];
  right: Field[];
  isRight: boolean;
};

export type FieldConfigType = Record<string, Record<string, boolean>>;

export interface ChildMetaField {
  label: string;
  fieldname: string;
  fieldtype: string;
  in_list_view: number;
}

export interface ChildRow {
  idx: number;
  [key: string]: any;
}
