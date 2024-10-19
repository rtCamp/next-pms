import { Billability, Priority, ProjectData, Status } from "@/store/project";
import { ColumnDef } from "@tanstack/react-table";
import { getTableProps, currencyFormat, columnMap } from "./helper";
import { Typography } from "@/app/components/typography";
import { cn } from "@/lib/utils";
import { Badge } from "@/app/components/ui/badge";

export const getColumn = () => {
  const tableAttributeProps = getTableProps();
  type ColumnsType = ColumnDef<ProjectData>[];
  const columnWidth = tableAttributeProps?.columnWidth;

  const columns: ColumnsType = [
    {
      accessorKey: "project_name",
      size: Number(columnWidth["project_name"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["project_name"]}
          </p>
        );
      },
      cell: ({ getValue, row }) => {
        const value = getValue() as string;
        return (
          <a href={`/app/project/${row.original.name}`} className="hover:underline">
            <Typography variant="p" className="truncate" title={value}>
              {value}
            </Typography>
          </a>
        );
      },
    },
    {
      accessorKey: "customer",
      size: Number(columnWidth["customer"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["customer"]}
          </p>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return (
          <a href={`/app/customer/${value}`} className="hover:underline">
            <Typography variant="p" className="truncate" title={value}>
              {value}
            </Typography>
          </a>
        );
      },
    },
    {
      accessorKey: "status",
      size: Number(columnWidth["status"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["status"]}
          </p>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as Status;
        return (
          <Badge variant={value === "Open" ? "secondary" : value === "Completed" ? "success" : "destructive"}>
            {value}
          </Badge>
        );
      },
    },
    {
      accessorKey: "project_type",
      size: Number(columnWidth["project_type"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["project_type"]}
          </p>
        );
      },
    },
    {
      accessorKey: "custom_business_unit",
      size: Number(columnWidth["custom_business_unit"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["custom_business_unit"]}
          </p>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return (
          <a href={`/app/business-unit/${value}`} className="hover:underline">
            <Typography variant="p" className="truncate" title={value}>
              {value}
            </Typography>
          </a>
        );
      },
    },
    {
      accessorKey: "priority",
      size: Number(columnWidth["priority"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["priority"]}
          </p>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as Priority;
        return (
          <Badge variant={value === "Low" ? "success" : value === "Medium" ? "warning" : "destructive"}>{value}</Badge>
        );
      },
    },
    {
      accessorKey: "company",
      size: Number(columnWidth["company"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["company"]}
          </p>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return (
          <a href={`/app/company/${value}`} className="hover:underline">
            <Typography variant="p" className="truncate" title={value}>
              {value}
            </Typography>
          </a>
        );
      },
    },
    {
      accessorKey: "custom_billing_type",
      size: Number(columnWidth["custom_billing_type"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["custom_billing_type"]}
          </p>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as Billability;
        return <Badge variant={"secondary"}>{value}</Badge>;
      },
    },
    {
      accessorKey: "custom_currency",
      size: Number(columnWidth["custom_currency"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["custom_currency"]}
          </p>
        );
      },
    },
    {
      accessorKey: "estimated_costing",
      size: Number(columnWidth["estimated_costing"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["estimated_costing"]}
          </p>
        );
      },
      cell: ({ getValue, row }) => {
        if (!getValue()) return <NoValue />;
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue() as number;
        return formatter.format(value);
      },
    },
    {
      accessorKey: "percent_complete_method",
      size: Number(columnWidth["percent_complete_method"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["percent_complete_method"]}
          </p>
        );
      },
    },
    {
      accessorKey: "actual_start_date",
      size: Number(columnWidth["actual_start_date"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["actual_start_date"]}
          </p>
        );
      },
    },
    {
      accessorKey: "actual_end_date",
      size: Number(columnWidth["actual_end_date"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["actual_end_date"]}
          </p>
        );
      },
    },
    {
      accessorKey: "actual_time",
      size: Number(columnWidth["actual_time"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["actual_time"]}
          </p>
        );
      },
      cell: ({ getValue, row }) => {
        const value = Number(getValue());
        const budget = Number(row.getValue("custom_total_hours_purchased"));
        return (
          <Typography variant="p" className={cn("text-center", value > budget && "text-warning")}>
            {value}h
          </Typography>
        );
      },
    },
    {
      accessorKey: "total_sales_amount",
      size: Number(columnWidth["total_sales_amount"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["total_sales_amount"]}
          </p>
        );
      },
      cell: ({ getValue, row }) => {
        if (!getValue()) return <NoValue />;
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue() as number;
        return formatter.format(value);
      },
    },
    {
      accessorKey: "total_billable_amount",
      size: Number(columnWidth["total_billable_amount"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["total_billable_amount"]}
          </p>
        );
      },
      cell: ({ getValue, row }) => {
        if (!getValue()) return <NoValue />;
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue() as number;
        return formatter.format(value);
      },
    },
    {
      accessorKey: "total_billed_amount",
      size: Number(columnWidth["total_billed_amount"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["total_billed_amount"]}
          </p>
        );
      },
      cell: ({ getValue, row }) => {
        if (!getValue()) return <NoValue />;
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue() as number;
        return formatter.format(value);
      },
    },
    {
      accessorKey: "total_costing_amount",
      size: Number(columnWidth["total_costing_amount"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["total_costing_amount"]}
          </p>
        );
      },
      cell: ({ getValue, row }) => {
        if (!getValue()) return <NoValue />;
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue() as number;
        return formatter.format(value);
      },
    },
    {
      accessorKey: "total_expense_claim",
      size: Number(columnWidth["total_expense_claim"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["total_expense_claim"]}
          </p>
        );
      },
      cell: ({ getValue, row }) => {
        if (!getValue()) return <NoValue />;
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue() as number;
        return formatter.format(value);
      },
    },
    {
      accessorKey: "custom_total_hours_purchased",
      size: Number(columnWidth["custom_total_hours_purchased"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["custom_total_hours_purchased"]}
          </p>
        );
      },
    },
    {
      accessorKey: "custom_total_hours_remaining",
      size: Number(columnWidth["custom_total_hours_remaining"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["custom_total_hours_remaining"]}
          </p>
        );
      },
    },
    {
      accessorKey: "custom_percentage_estimated_cost",
      size: Number(columnWidth["custom_percentage_estimated_cost"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["custom_percentage_estimated_cost"]}
          </p>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return <Typography variant="p">{value}%</Typography>;
      },
    },
    // {
    //   accessorKey: "percent_complete",
    //   sortingFn: sortPercentageComplete,
    //   header: ({ column }) => {
    //     return (
    //       <p className="truncate" id={column.id}>
    //         {columnMap["percent_complete"]}
    //       </p>
    //     );
    //   },
    //   cell: ({ row }) => {
    //     const budget = Number(row.getValue("custom_total_hours_purchased"));
    //     const spent = Number(row.getValue("actual_time"));
    //     const per = calculatePercentage(spent, budget);
    //     return budget ? (
    //       <div>
    //         <Typography
    //           variant="small"
    //           className={cn("text-primary float-right", spent > budget && "text-destructive")}
    //         >
    //           {per}%
    //         </Typography>
    //         <Progress
    //           value={per}
    //           className={cn("h-2 bg-success/20", spent > budget && "bg-destructive/20", budget == 0 && "bg-secondary")}
    //           indicatorClassName={cn("bg-success", spent > budget && "bg-destructive")}
    //         />
    //       </div>
    //     ) : null;
    //   },
    // },
    {
      accessorKey: "gross_margin",
      size: Number(columnWidth["gross_margin"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["gross_margin"]}
          </p>
        );
      },
      cell: ({ getValue, row }) => {
        if (!getValue()) return <NoValue />;
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue() as number;
        return formatter.format(value);
      },
    },
    {
      accessorKey: "per_gross_margin",
      size: Number(columnWidth["per_gross_margin"]),
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {columnMap["per_gross_margin"]}
          </p>
        );
      },
      cell: ({ getValue }) => {
        if (!getValue()) return <NoValue />;
        const value = getValue() as string;
        return <Typography variant="p">{parseFloat(value).toFixed(2)}%</Typography>;
      },
    },
  ];
  return columns;
};

export const NoValue = () => {
  return <span></span>;
};
