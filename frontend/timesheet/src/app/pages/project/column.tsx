import { Billability, Priority, ProjectData, Status } from "@/store/project";
import { ColumnDef } from "@tanstack/react-table";

import { getTableProps, calculatePercentage, sortPercentageComplete, currencyFormat } from "./helper";
import { Typography } from "@/app/components/typography";
import { cn, floatToTime, getDateTimeForMultipleTimeZoneSupport } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import { Badge } from "@/app/components/ui/badge";

export const getColumn = () => {
  const tableAttributeProps = getTableProps();
  type ColumnsType = ColumnDef<ProjectData>[];
  const columnWidth = tableAttributeProps?.columnWidth;

  const columns: ColumnsType = [
    {
      accessorKey: "project_name",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Project Name</p>
          </Header>
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
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Customer Name</p>
          </Header>
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
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Status</p>
          </Header>
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
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Project Type</p>
          </Header>
        );
      },
    },
    {
      accessorKey: "custom_business_unit",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Businees Unit</p>
          </Header>
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
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Priority</p>
          </Header>
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
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Company</p>
          </Header>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as string;
        return (
          <a href={`/app/company/$value}`} className="hover:underline">
            <Typography variant="p" className="truncate" title={value}>
              {value}
            </Typography>
          </a>
        );
      },
    },
    {
      accessorKey: "custom_billing_type",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Billing type</p>
          </Header>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue() as Billability;
        return <Badge variant={"secondary"}>{value}</Badge>;
      },
    },
    {
      accessorKey: "custom_currency",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Currency</p>
          </Header>
        );
      },
    },
    {
      accessorKey: "estimated_costing",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Estimated Cost</p>
          </Header>
        );
      },
      cell: ({ getValue, row }) => {
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue();
        return formatter.format(value);
      },
    },
    {
      accessorKey: "percent_complete_method",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Completion Method</p>
          </Header>
        );
      },
    },
    {
      accessorKey: "actual_start_date",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Start Date (via Timesheet)</p>
          </Header>
        );
      },
    },
    {
      accessorKey: "actual_end_date",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">End Date (via Timesheet)</p>
          </Header>
        );
      },
    },
    {
      accessorKey: "actual_time",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Budget Spent (Hours)</p>
          </Header>
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
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Total Sales Amount</p>
          </Header>
        );
      },
      cell: ({ getValue, row }) => {
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue();
        return formatter.format(value);
      },
    },
    {
      accessorKey: "total_billable_amount",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Total Billing Amount</p>
          </Header>
        );
      },
      cell: ({ getValue, row }) => {
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue();
        return formatter.format(value);
      },
    },
    {
      accessorKey: "total_billed_amount",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Total Billed Amount</p>
          </Header>
        );
      },
      cell: ({ getValue, row }) => {
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue();
        return formatter.format(value);
      },
    },
    {
      accessorKey: "total_costing_amount",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Total Costing Amount</p>
          </Header>
        );
      },
      cell: ({ getValue, row }) => {
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue();
        return formatter.format(value);
      },
    },
    {
      accessorKey: "total_expense_claim",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Total Expense Claim</p>
          </Header>
        );
      },
      cell: ({ getValue, row }) => {
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue();
        return formatter.format(value);
      },
    },
    {
      accessorKey: "custom_total_hours_purchased",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Total Hours Purchased</p>
          </Header>
        );
      },
    },
    {
      accessorKey: "custom_total_hours_remaining",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Total Hours Remaining</p>
          </Header>
        );
      },
    },
    {
      accessorKey: "custom_percentage_estimated_cost",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">% Estimated Cost</p>
          </Header>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue();
        return <Typography variant="p">{value}%</Typography>;
      },
    },
    {
      accessorKey: "percent_complete",
      sortingFn: sortPercentageComplete,
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">% Completed</p>
          </Header>
        );
      },
      cell: ({ row }) => {
        const budget = Number(row.getValue("custom_total_hours_purchased"));
        const spent = Number(row.getValue("actual_time"));
        const per = calculatePercentage(spent, budget);
        return budget ? (
          <div>
            <Typography
              variant="small"
              className={cn("text-primary float-right", spent > budget && "text-destructive")}
            >
              {per}%
            </Typography>
            <Progress
              value={per}
              className={cn("h-2 bg-success/20", spent > budget && "bg-destructive/20", budget == 0 && "bg-secondary")}
              indicatorClassName={cn("bg-success", spent > budget && "bg-destructive")}
            />
          </div>
        ) : null;
      },
    },
    {
      accessorKey: "gross_margin",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">Gross Margin</p>
          </Header>
        );
      },
      cell: ({ getValue, row }) => {
        const formatter = currencyFormat(row.original.custom_currency);
        const value = getValue();
        return formatter.format(value);
      },
    },
    {
      accessorKey: "per_gross_margin",
      header: ({ column }) => {
        return (
          <Header column={column}>
            <p className="truncate">%Gross Margin</p>
          </Header>
        );
      },
      cell: ({ getValue }) => {
        const value = getValue();
        return <Typography variant="p">{value}%</Typography>;
      },
    },
  ];
  return columns;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Header = ({ column, children }: { column: any; children: any }) => {
  return (
    <div
      className="flex items-center gap-1 group-hover:text-black transition-colors ease duration-200 select-none cursor-pointer w-full "
      title={column.id}
      onClick={() => {
        column.toggleSorting();
      }}
    >
      {children}
      <ArrowUpDown
        className={cn(
          "transition-colors ease duration-200 hover:cursor-pointer flex-shrink-0",
          column.getIsSorted() === "desc" && "text-orange-500",
        )}
      />
    </div>
  );
};
