export type Field = {
  fieldtype: string;
  label?: string;
  value?: string | number | null;
  reqd?: string | number;
  read_only?: string | number;
  options?: string;
  description?: string | null;
  fieldname: string;
};

export type Section = {
  title: string;
  left: Field[];
  right: Field[];
  isRight: boolean;
};
