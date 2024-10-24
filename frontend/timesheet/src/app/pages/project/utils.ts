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
    "gross_margin",
    "per_gross_margin",
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
        filters: [],
        default: 1,
        public: 0,
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
        business_unit: projectState.selectedBusinessUnit
    }
}