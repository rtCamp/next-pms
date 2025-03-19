/* eslint-disable @typescript-eslint/no-explicit-any */
import { ViewData } from "@/store/view";
import { fieldMetaProps, sortOrder, DocMetaProps } from "@/types";

export interface FilterPops {
  queryParameterName?: string;
  queryParameterDefault?: string | string[] | boolean | undefined;
  hide?: boolean;
  handleChange?: any;
  handleDelete?: any;
  data?: { value: string; label: string }[];
  type:
    | "search"
    | "select-search"
    | "select"
    | "checkbox"
    | "search-employee"
    | "select-list"
    | "custom-filter"
    | "search-project";
  value?: string | number | boolean | string[] | undefined;
  defaultValue?: string | boolean | number;
  label?: string;
  className?: string;
  isMultiComboBox?: boolean;
  employeeComboStatus?: Array<string>;
  shouldFilterComboBox?: boolean;
  onComboSearch?: (searchTerm: string) => void;
  apiCall?: ApiCallProps;
  employeeName?: string;
  customFilterComponent?: React.ReactNode;
  onSearch?: (searchTerm: string) => void;
  hideQueryParam?: boolean;
}

export type ViewWrapperProps = {
  docType: string;
  children: (props: {
    viewData: ViewData;
    meta: { message: DocMetaProps };
  }) => React.ReactNode;
};

export interface ApiCallProps {
  url: string;
  filters: object;
  options?: object;
}

export interface ExportProps {
  doctype: string;
  fields: Record<string, string>;
  filters?: Record<string, any>;
  orderBy: string;
  pageLength: number;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  totalCount: number;
}

export interface ColumnSelectorProps {
  fieldMeta: Array<fieldMetaProps>;
  onColumnHide: (id: string) => void;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  columnOrder: string[];
}
export interface SortProps {
  fieldMeta: Array<fieldMetaProps>;
  orderBy: sortOrder;
  field: string;
  onSortChange: (order: sortOrder, orderColumn: string) => void;
}
export interface HeaderProps {
  className?: string;
  filters: FilterPops[];
  buttons: ButtonProps[];
  docType?: string;
  showColumnSelector?: boolean;
  columnSelector?: ColumnSelectorProps;
  showSort?: boolean;
  sort?: SortProps;
  showActions?: boolean;
  actionProps?: ActionProps;
  showFilterValue?: boolean;
  customComponents?: React.ReactNode[];
}
export interface ButtonProps {
  title: string;
  handleClick: any;
  label?: string;
  icon?: React.FC;
  className?: string;
  variant?:
    | "link"
    | "default"
    | "destructive"
    | "success"
    | "warning"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  hide?: boolean;
  disabled?: boolean;
}
export interface ActionProps {
  docType: string;
  exportProps: ExportOptions;
  viewProps: ViewProps;
}
export type ExportOptions = Omit<
  ExportProps,
  "isOpen" | "setIsOpen" | "doctype"
>;
export type ViewProps = {
  rows: Array<string>;
  filters: Record<string, string | number | Array<string>>;
  orderBy: { field: string; order: string };
  columns: Record<string, number | string>;
};

export interface CreateViewProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dt: string;
  rows: Array<string>;
  filters: Record<string, string | number | Array<string>>;
  orderBy: { field: string; order: string };
  route: string;
  isDefault: boolean;
  columns: Record<string, number | string>;
  isPublic: boolean;
}
