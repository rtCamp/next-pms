/**
 * Internal dependencies
 */
import { Typography } from "@/app/components/typography";
import { Badge } from "@/app/components/ui/badge";
import { cn, floatToTime } from "@/lib/utils";
import { Progress } from "@/app/components/ui/progress";
import { getColumns } from "@/app/components/listview/Columns";

const HOUR_FIELD = ["actual_time", "custom_total_hours_purchased", "custom_total_hours_remaining"];

export const getColumnInfo = (
  fieldMeta: Array<any>,
  fieldInfo: Array<string>,
  columnInfo: any,
  title_field: string,
  docType: string,
  currency: string
) => {
  let column = [];
  fieldInfo.forEach((f) => {
    const meta = fieldMeta.find((field) => field.fieldname === f);
    if (!meta) return;
    const col = {
      accessorKey: meta.fieldname,
      size: columnInfo[meta.fieldname] ?? 150,
      header: ({ column }) => {
        return (
          <p className="truncate" id={column.id}>
            {meta.label}
          </p>
        );
      },
      cell: ({ getValue, row }) => {
        const value = getValue() as string;

        if (meta.fieldtype === "Link") {
          return (
            <a href={`/app/${meta.options.toLowerCase().replace(/ /g, "-")}/${value}`} className="hover:underline">
              <Typography variant="p" className="truncate" title={value}>
                {value}
              </Typography>
            </a>
          );
        } else if (meta.fieldtype === "Percent") {
          const val = parseFloat(value);
          const per = val > 0 ? Number(val.toFixed(2)) : 0;
          const color = progressBarColor(meta.fieldname, fieldInfo, row, per);
          return (
            <span>
              <Typography
                variant="small"
                className={cn("truncate", per < 0 && "text-destructive")}
                title={per.toString()}
              >
                {per}%
              </Typography>
              <Progress className="h-2" indicatorClassName={cn(color)} value={per} title={per.toString()} />
            </span>
          );
        } else if (HOUR_FIELD.includes(meta.fieldname)) {
          const hour = getValue() as number;
          return (
            <Typography variant="p" className="truncate" title={value}>
              {floatToTime(hour)}h
            </Typography>
          );
        } else if (meta.fieldname === "status") {
          return (
            <Badge variant={value === "Open" ? "warning" : value === "Completed" ? "success" : "destructive"}>
              {value}
            </Badge>
          );
        } else if (meta.fieldname === "priority") {
          return (
            <Badge variant={value === "Low" ? "success" : value === "Medium" ? "warning" : "destructive"}>
              {value}
            </Badge>
          );
        } else if (meta.fieldname === "project_name") {
          return (
            <a href={`/app/project/${row.original.name}`} className="hover:underline">
              <Typography variant="p" className="truncate" title={value}>
                {value}
              </Typography>
            </a>
          );
        } else {
          return getColumns(meta, title_field, docType, row, value, currency);
        }
      },
    };
    column.push(col);
  });
  return column;
};
export const Empty = () => {
  return <span></span>;
};

const progressBarColor = (field: string, fieldInfo: Array<string>, row: any, value: number) => {
  if (field == "custom_percentage_estimated_cost" && fieldInfo.includes("percent_complete")) {
    const perEstimatedCost = row.original["custom_percentage_estimated_cost"];
    const percentComplete = row.original["percent_complete"];
    const diff = ((percentComplete - perEstimatedCost) / perEstimatedCost) * 100;
    return perEstimatedCost < percentComplete ? "bg-success" : diff > 0 && diff <= 10 ? "bg-warning" : "bg-destructive";
  } else {
    return value < 34 ? "bg-destructive" : value < 67 ? "bg-warning" : "bg-success";
  }
};
