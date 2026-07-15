/**
 * External dependencies.
 */
import {
  Button,
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import { REPORT_COLUMNS } from "./constants";
import type { ProjectReportRow } from "../../types";

interface ReportsTableProps {
  reports: ProjectReportRow[];
}

const formatGeneratedOn = (value?: string) => {
  if (!value) return "—";
  return format(parseISO(value.replace(" ", "T")), "dd MMM yyyy, HH:mm");
};

function ReportLinkCell({ report }: { report: ProjectReportRow }) {
  if (!report.report_link) {
    return null;
  }
  return (
    <Button
      variant="ghost"
      label="View Report"
      icon={ArrowUpRight}
      link={report.report_link}
    />
  );
}

export function ReportsTable({ reports }: ReportsTableProps) {
  const rows = reports
    .map((report, index) => ({
      ...report,
      id: report.run_id || `report-${index}`,
      index: index + 1,
    }))
    .reverse();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-ink-gray-8">Project Reports</h2>
      {rows.length === 0 ? (
        <p className="text-base text-ink-gray-5">No reports generated yet.</p>
      ) : (
        <ListView
          columns={REPORT_COLUMNS}
          rows={rows}
          rowKey="id"
          options={{ options: { selectable: false, resizeColumn: false } }}
        >
          <ListHeader className="mb-0 rounded-none border-b border-outline-gray-1 bg-transparent p-1 px-2 gap-4">
            {REPORT_COLUMNS.map((column) => (
              <ListHeaderItem key={column.key} item={column}>
                {column.label}
              </ListHeaderItem>
            ))}
          </ListHeader>
          <ListRows>
            {rows.map((row) => (
              <ListRow key={row.id} row={row} className="gap-4">
                {REPORT_COLUMNS.map((column) => (
                  <div
                    key={column.key}
                    className={mergeClassNames(
                      "flex items-center text-base text-ink-gray-7",
                      { "justify-end": column.align === "right" },
                    )}
                  >
                    {column.key === "reportLink" ? (
                      <ReportLinkCell report={row} />
                    ) : column.key === "status" ? (
                      <span className="truncate">{row.status}</span>
                    ) : column.key === "generatedOn" ? (
                      <span className="truncate">
                        {formatGeneratedOn(row.generated_on)}
                      </span>
                    ) : column.key === "dateRange" ? (
                      <span className="truncate">{row.date_range}</span>
                    ) : (
                      <span className="truncate">{row.index}</span>
                    )}
                  </div>
                ))}
              </ListRow>
            ))}
          </ListRows>
        </ListView>
      )}
    </section>
  );
}
