/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExportProps } from "@/app/components/listview/Export";
import { fieldMetaProps, sortOrder } from "@/types";
export interface FilterPops {
    queryParameterName: string;
    queryParameterDefault: string | string[] | boolean | undefined;
    hide?: boolean;
    handleChange: any;
    handleDelete?: any;
    data?: { value: string; label: string }[];
    type: "search" | "select-search" | "select" | "checkbox" | "search-employee" | "select-list";
    value: string | number | boolean | string[] | undefined;
    defaultValue?: string | boolean | number;
    label?: string;
    className?: string;
    isMultiComboBox?: boolean;
    shouldFilterComboBox?: boolean;
    onComboSearch?: (searchTerm: string) => void;
    apiCall?: ApiCallProps;
}

export interface ApiCallProps {
    url: string;
    filters: object;
    options?: object;
}

export interface ColumnSelectorProps {
    fieldMeta: Array<fieldMetaProps>;
    onColumnHide: (id: string) => void;
    setColumnOrder: (newOrder: string[]) => void;
    columnOrder: string[];
}
export interface SortProps {
    fieldMeta: Array<fieldMetaProps>;
    orderBy: sortOrder;
    field: string;
    onSortChange: (order: sortOrder, orderColumn: string) => void;
}
export interface HeaderProps {
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
}
export interface ActionProps {
    docType: string;
    exportProps: ExportOptions;
    viewProps: ViewProps;
}
export type ExportOptions = Omit<ExportProps, "isOpen" | "setIsOpen" | "doctype">;
export type ViewProps = {
    rows: Array<string>;
    filters: Record<string, string | number | Array<string>>;
    orderBy: { field: string; order: string };
    columns: Record<string, number | string>;
};