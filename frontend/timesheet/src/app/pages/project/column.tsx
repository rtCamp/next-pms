import { getTableProps, currencyFormat, getFieldInfo } from "./helper";
import { Typography } from "@/app/components/typography";

import { Badge } from "@/app/components/ui/badge";

export const getColumn = (type: string | undefined, metaFields: Array<any> | undefined) => {
  if (!metaFields) return [];
  const tableAttributeProps = getTableProps(type);

  const columnWidth = tableAttributeProps?.columnWidth;
  const fields = getFieldInfo(type);
  let columns = [];

  fields.map((field) => {
    const meta = metaFields.find((f) => f.fieldname === field);
    if (meta) {
      columns.push({
        accessorKey: field,
        size: Number(columnWidth[field]),
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
          } else if (meta.fieldtype == "Percentage") {
            return (
              <Typography variant="p" className="truncate" title={value}>
                {value}%
              </Typography>
            );
          } else if (meta.fieldtype == "Currency") {
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
      });
    }
  });

  return columns;
};

export const NoValue = () => {
  return <span></span>;
};
