/**
 * External dependencies.
 */
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
  Spinner,
} from "@rtcamp/frappe-ui-react";
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
  if (report.status === "Generating") {
    return (
      <span className="flex items-center gap-2 text-ink-amber-3">
        <Spinner className="size-3" /> Generating…
      </span>
    );
  }
  if (report.status === "Failed") {
    return <span className="text-ink-red-3">Failed</span>;
  }
  if (report.status === "Completed" || !report.report_link) {
    return <span className="text-ink-gray-5">No document</span>;
  }
  return (
    <a
      href={report.report_link}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ink-blue-3 underline"
    >
      View Report
    </a>
  );
}

export function ReportsTable({ reports }: ReportsTableProps) {
  const rows = reports.map((report, index) => ({
    ...report,
    id: report.run_id || `report-${index}`,
    index: index + 1,
  }));

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
