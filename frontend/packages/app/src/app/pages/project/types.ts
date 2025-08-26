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

export type AddProjectType = {
  naming_series: string;
  project_name: string;
  project_template: string | null;
  company: string;
};

export interface ProjectUpdate {
  name: string;
  title: string;
  description: string;
  status: "Draft" | "Review" | "Publish";
  project: string;
  owner_full_name: string;
  owner_image: string;
  comments: ProjectComment[];
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: number;
}

export interface ProjectComment {
  idx: number;
  user: string;
  user_full_name: string;
  user_image: string;
  comment: string;
  created_at: string;
  modified_at: string;
  owner: string;
  modified_by: string;
}
