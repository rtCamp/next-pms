/**
 * Internal dependencies.
 */
import type { ViewData } from "@/store/view";
import type { DocMetaProps } from "@/types";

export type FieldMeta = Omit<
  DocMetaProps,
  "title_field" | "doctype" | "default_fields"
>;

export interface HeaderProps {
  meta: DocMetaProps;
  columnOrder: Array<string>;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  onColumnHide: (column: string) => void;
  view: ViewData;
  stateUpdated: boolean;
  setStateUpdated: (value: boolean) => void;
}

export type ProjectProps = {
  viewData: ViewData;
  meta: DocMetaProps;
};
