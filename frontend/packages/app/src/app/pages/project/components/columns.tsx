/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * External dependencies.
 */
import { NavigateFunction } from "react-router-dom";
import { Typography, Badge, Progress } from "@next-pms/design-system/components";
import { floatToTime } from "@next-pms/design-system/utils";
/**
 * Internal dependencies.
 */
import { DataCell } from "@/app/components/list-view/dataCell";
import { mergeClassNames } from "@/lib/utils";
import type { FieldMeta } from "../types";
import { getValidUserTagsValues } from "../utils";

const HOUR_FIELD = ["actual_time", "custom_total_hours_purchased", "custom_total_hours_remaining"];

export const getColumnInfo = (
  fieldMeta: FieldMeta["fields"],
  fieldInfo: Array<string>,
  columnInfo: any,
  title_field: string,
  docType: string,
  currency: string,
  navigate: NavigateFunction
) => {
  const columns = [];

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
            <a href={`/app/${meta?.options?.toLowerCase().replace(/ /g, "-")}/${value}`} className="hover:underline">
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
                className={mergeClassNames("truncate", per < 0 && "text-destructive")}
                title={per.toString()}
              >
                {per}%
              </Typography>
              <Progress
                className="h-2"
                indicatorClassName={mergeClassNames(color)}
                value={per}
                title={per.toString()}
              />
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
            <Badge
              className="truncate"
              variant={value === "Open" ? "warning" : value === "Completed" ? "success" : "destructive"}
            >
              {value}
            </Badge>
          );
        } else if (meta.fieldname === "priority") {
          return (
            <Badge
              className="truncate"
              variant={value === "Low" ? "success" : value === "Medium" ? "warning" : "destructive"}
            >
              {value}
            </Badge>
          );
        } else if (meta.fieldname === "project_name") {
          return (
            <Typography
              onClick={(e) => {
                e.stopPropagation();
                navigate(row.original.name);
              }}
              variant="p"
              className="truncate hover:underline cursor-pointer"
              title={value}
            >
              {value}
            </Typography>
          );
        } else {
          return (
            <DataCell
              meta={meta}
              title_field={title_field}
              docType={docType}
              value={value}
              row={row}
              currency={currency}
            />
          );
        }
      },
    };
    columns.push(col);
  });
  const userTagsCol = {
    accessorKey: "_user_tags",
    size: 90,
    header: ({ column }) => {
      return (
        <p className="truncate" id={column.id}>
          Tags
        </p>
      );
    },
    cell: ({ getValue }) => {
      const tags = getValidUserTagsValues(getValue());

      return (
        <div className="truncate w-full flex gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
  };
  columns.push(userTagsCol);
  return columns;
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
