/**
 * External dependencies
 */
import {
  Typography,
  Badge,
  Progress,
} from "@next-pms/design-system/components";
import { getUTCDateTime } from "@next-pms/design-system/date";

/**
 * Internal dependencies
 */
import { mergeClassNames, currencyFormat } from "@/lib/utils";
import type { fieldMetaProps } from "@/types";

const NUMBER_FIELDS = ["Int", "Long Int", "Float"];
const NO_VALUE_FIELDS = [
  "Section Break",
  "Column Break",
  "Tab Break",
  "HTML",
  "Table",
  "Table MultiSelect",
  "Button",
  "Image",
  "Fold",
  "Heading",
  "Barcode",
];

const SUCCESS_SELECT_VALUES = [
  "Success",
  "Completed",
  "Closed",
  "Accepted",
  "Active",
  "Enabled",
  "Published",
  "Approved",
  "Yes",
];
const FAIL_SELECT_VALUES = [
  "Failed",
  "Cancelled",
  "Rejected",
  "Inactive",
  "Disabled",
  "No",
];
const OPEN_SELECT_VALUES = ["Open", "Pending", "Draft", "Not Started"];

interface DataCellProps {
  meta: fieldMetaProps;
  title_field: string;
  docType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any;
  value: string;
  currency?: string;
}
export const DataCell = ({
  meta,
  title_field,
  docType,
  row,
  value,
  currency,
}: DataCellProps) => {
  if (!meta) return;
  if (NO_VALUE_FIELDS.includes(meta.fieldtype)) return;

  if (meta.fieldtype === "Link") {
    return (
      <a
        href={`/app/${meta.options?.toLowerCase().replace(/ /g, "-")}/${value}`}
        className="hover:underline"
      >
        <Typography variant="p" className="truncate" title={value}>
          {value}
        </Typography>
      </a>
    );
  } else if (meta.fieldtype === "Currency") {
    const formatter = currencyFormat(
      currency
        ? currency
        : (row.original?.custom_currency ?? row.original?.currency ?? "INR"),
    );
    const val = Number(value);
    return (
      <Typography
        variant="p"
        className={mergeClassNames(
          "truncate text-right",
          val < 0 && "text-destructive",
        )}
        title={val.toString()}
      >
        {formatter.format(val)}
      </Typography>
    );
  } else if (meta.fieldtype === "Date") {
    const date = getUTCDateTime(value).toLocaleDateString();
    return (
      <Typography variant="p" className="truncate" title={value}>
        {date}
      </Typography>
    );
  } else if (meta.fieldtype === "Percent") {
    const val = parseFloat(value);
    const per = val > 0 ? Number(val.toFixed(2)) : 0;
    const color = progressBarColor(per);
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
  } else if (NUMBER_FIELDS.includes(meta.fieldtype)) {
    const val = parseFloat(value).toFixed(2);
    return (
      <Typography variant="p" className="truncate" title={val}>
        {Number(val)}
      </Typography>
    );
  } else if (meta.fieldname === title_field && row.original.includes("name")) {
    return (
      <a
        href={`/app/${docType}/${row.original.name}`}
        className="hover:underline"
      >
        <Typography variant="p" className="truncate" title={value}>
          {value}
        </Typography>
      </a>
    );
  } else if (meta.fieldtype === "Select") {
    if (SUCCESS_SELECT_VALUES.includes(value)) {
      if (!value) return null;
      return (
        <Badge
          className={mergeClassNames(
            "truncate",
            "bg-success/20 text-success hover:bg-success/20",
          )}
          variant="success"
        >
          {value}
        </Badge>
      );
    } else if (FAIL_SELECT_VALUES.includes(value)) {
      if (!value) return null;
      return (
        <Badge
          className={mergeClassNames(
            "truncate",
            "bg-destructive/20 text-destructive hover:bg-destructive/20",
          )}
          variant="destructive"
        >
          {value}
        </Badge>
      );
    } else if (OPEN_SELECT_VALUES.includes(value)) {
      if (!value) return null;
      return (
        <Badge
          className={mergeClassNames(
            "truncate",
            "bg-warning/20 text-warning hover:bg-warning/20",
          )}
          variant="warning"
        >
          {value}
        </Badge>
      );
    } else {
      if (!value) return null;
      return (
        <Badge
          className={mergeClassNames(
            "truncate",
            selectBadgeColor(value, meta.options?.split("\n") ?? []),
          )}
        >
          {value}
        </Badge>
      );
    }
  } else if (meta.fieldtype === "Check") {
    const val = Number(value);

    return (
      <Badge
        className={mergeClassNames(
          "truncate",
          val === 1
            ? "bg-success/20 text-success hover:bg-success/20"
            : "bg-destructive/20 text-destructive hover:bg-destructive/20",
        )}
        variant={val === 1 ? "success" : "destructive"}
        title={value}
      >
        {val === 1 ? "Yes" : "No"}
      </Badge>
    );
  } else {
    return (
      <Typography
        variant="p"
        className={mergeClassNames("truncate", leftAlignCss(meta.fieldtype))}
        title={value}
      >
        {value}
      </Typography>
    );
  }
};

const leftAlignCss = (fieldType: string) => {
  const type = ["Int", "Currency", "Float"];

  if (type.includes(fieldType)) {
    return "text-right";
  }
  return "";
};

const progressBarColor = (value: number) => {
  return value < 34
    ? "bg-destructive"
    : value < 67
      ? "bg-warning"
      : "bg-success";
};

const selectBadgeColor = (value: string, options: Array<string>) => {
  const colors = [
    "bg-success/20 text-success",
    "bg-blue-600/20 text-blue-900 dark:bg-primary/70",
    "bg-slate-600/20 text-slate-900 dark:bg-primary/70",
    "bg-purple-600/20 text-purple-900 dark:bg-primary/70",
    "bg-teal-600/20 text-teal-900 dark:bg-primary/70",
    "bg-orange-600/20 text-orange-900 dark:bg-primary/70",
    "bg-zinc-600/20 text-zinc-900 dark:bg-primary/70",
    "bg-yellow-600/20 text-yellow-900 dark:bg-primary/70",
    "bg-gray-600/20 text-gray-900 dark:bg-primary/70",
  ];

  const colorMap = options.reduce(
    (acc, option, index) => {
      acc[option] = colors[index % colors.length];
      return acc;
    },
    {} as Record<string, string>,
  );

  return colorMap[value] || "bg-black";
};
