import { currencyFormat } from "./helper";
import { Typography } from "@/app/components/typography";
import { Badge } from "@/app/components/ui/badge";
import { floatToTime, getDateTimeForMultipleTimeZoneSupport } from "@/lib/utils";

const HOUR_FIELD = ["actual_time", "custom_total_hours_purchased", "custom_total_hours_remaining"];

export const getColumnInfo = (fieldMeta: Array<any>, fieldInfo: Array<string>, columnInfo: any) => {
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
        if (!value) return <Empty />;
        if (meta.fieldtype === "Link") {
          return (
            <a href={`/app/${meta.options.toLowerCase().replace(/ /g, "-")}/${value}`} className="hover:underline">
              <Typography variant="p" className="truncate" title={value}>
                {value}
              </Typography>
            </a>
          );
        } else if (meta.fieldtype === "Currency") {
          const formatter = currencyFormat(row.original.custom_currency ?? "INR");
          const value = getValue() as number;
          return (
            <Typography variant="p" className="truncate" title={value.toString()}>
              {formatter.format(value)}
            </Typography>
          );
        } else if (meta.fieldtype === "Date") {
          const date = getDateTimeForMultipleTimeZoneSupport(value).toLocaleDateString();
          return (
            <Typography variant="p" className="truncate" title={value}>
              {date}
            </Typography>
          );
        } else if (meta.fieldtype === "Percent") {
          return (
            <Typography variant="p" className="truncate" title={value}>
              {parseFloat(value).toFixed(2)}%
            </Typography>
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
            <Badge variant={value === "Open" ? "secondary" : value === "Completed" ? "success" : "destructive"}>
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
          return (
            <Typography variant="p" className="truncate" title={value}>
              {value}
            </Typography>
          );
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
