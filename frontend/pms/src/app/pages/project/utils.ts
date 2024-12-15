/**
 * Internal dependencies.
 */
import { ProjectState } from "@/store/project";

export const defaultRows: string[] = [
    "name",
    "project_name",
    "project_type",
    "custom_business_unit",
    "status",
    "priority",
    "customer",
    "company",
    "custom_billing_type",
    "custom_currency",
    "estimated_costing",
    "custom_percentage_estimated_cost",
    "percent_complete_method",
    "actual_start_date",
    "actual_end_date",
    "actual_time",
    "total_sales_amount",
    "total_billable_amount",
    "total_billed_amount",
    "total_costing_amount",
    "total_expense_claim",
    "custom_total_hours_purchased",
    "custom_total_hours_remaining",
    "custom_estimated_profit",
    "custom_percentage_estimated_profit",
    "percent_complete",
];

export const defaultView = () => {
    const columns = Object.fromEntries(
        defaultRows.map((value) => [value, 150])
    );
    const view = {
        label: "Project",
        user: "",
        type: "List",
        dt: "Project",
        route: "project",
        rows: defaultRows,
        columns: columns,
        filters: { "search": "", "project_type": [], "status": [], "business_unit": [], "currency": "", "billing_type": [] },
        default: true,
        public: false,
        order_by: {
            field: "project_name",
            order: "desc",
        }
    }
    return view;
}
export const createFilter = (projectState: ProjectState) => {
    return {
        search: projectState.search,
        project_type: projectState.selectedProjectType,
        status: projectState.selectedStatus,
        business_unit: projectState.selectedBusinessUnit,
        currency: projectState.currency,
        billing_type: projectState.selectedBillingType
    }
}

export const currencyFormat = (currency: string) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency,
    });
};
export const getFilter = (projectState: ProjectState) => {
    const filters = [];

    if (projectState.search) {
        filters.push(["project_name", "like", `%${projectState.search}%`]);
    }
    if (projectState.selectedProjectType.length > 0) {
        filters.push(["project_type", "in", projectState.selectedProjectType]);
    }
    if (projectState.selectedStatus.length > 0) {
        filters.push(["status", "in", projectState.selectedStatus]);
    }
    if (projectState.selectedBusinessUnit.length > 0) {
        filters.push(["custom_business_unit", "in", projectState.selectedBusinessUnit]);
    }
    if (projectState.selectedBillingType.length > 0) {
        filters.push(["custom_billing_type", "in", projectState.selectedBillingType]);
    }
    return filters;
};
