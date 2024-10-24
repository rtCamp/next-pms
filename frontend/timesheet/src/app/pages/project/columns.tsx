import {  currencyFormat, } from "./helper";
import { Typography } from "@/app/components/typography";
import { Badge } from "@/app/components/ui/badge";


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
        if (!value) return <NoValue />;
        if (meta.fieldtype === "Link") {
          return (
            <a href={`/app/${meta.options.toLowerCase().replace(/ /g, "-")}/${value}`} className="hover:underline">
              <Typography variant="p" className="truncate" title={value}>
                {value}
              </Typography>
            </a>
          );
        } else if (meta.fieldtype === "Currency" ) {
          const formatter = currencyFormat(row.original.custom_currency ?? "INR");
          const value = getValue() as number;
          return (
            <Typography variant="p" className="truncate" title={value.toString()}>
              {formatter.format(value)}
            </Typography>
          );
        } else if (meta.fieldname === "status") {
          return (
            <Badge variant={value === "Open" ? "secondary" : value === "Completed" ? "success" : "destructive"}>
              {value}
            </Badge>
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
export const NoValue = () => {
  return <span></span>;
};
