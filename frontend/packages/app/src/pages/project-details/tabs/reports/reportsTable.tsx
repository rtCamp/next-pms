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
  Spinner,
} from "@rtcamp/frappe-ui-react";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import { REPORT_COLUMNS } from "./constants";
import { useProjectDetail } from "../../context";
import type { ProjectReportRow } from "../../types";

interface ReportsTableProps {
  reports: ProjectReportRow[];
}

const formatGeneratedOn = (value?: string) => {
  if (!value) return "—";
  return format(parseISO(value.replace(" ", "T")), "dd MMM yyyy, HH:mm");
};

function StatusCell({ report }: { report: ProjectReportRow }) {
  if (report.status === "Generating") {
    return (
      <span className="flex items-center gap-2">
        <Spinner className="h-3.5 w-3.5" />
        Generating...
      </span>
    );
  }
  return <span className="truncate">{report.status}</span>;
}

function ReportActionCell({ report }: { report: ProjectReportRow }) {
  if (report.status === "Done" && Boolean(report.report_link)) {
    return (
      <Button
        variant="ghost"
        label="View Report"
        icon={ArrowUpRight}
        link={report.report_link}
      />
    );
  }
  return null;
}

export function ReportsTable({ reports }: ReportsTableProps) {
  const mutate = useProjectDetail((state) => state.mutate);

  const totalCount = reports.length;

  const rows = [...reports]
    .sort((a, b) => {
      if (a.status === "Generating") return -1;
      if (b.status === "Generating") return 1;
      return (b.generated_on ?? "").localeCompare(a.generated_on ?? "");
    })
    .map((report, index) => ({
      ...report,
      id: report.run_id || `report-${index}`,
      index: totalCount - index,
    }));

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-gray-8">
          Project Reports
        </h2>
        {reports.length > 0 && (
          <Button variant="subtle" label="Resync" onClick={() => mutate()} />
        )}
      </div>

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
                      <ReportActionCell report={row} />
                    ) : column.key === "status" ? (
                      <StatusCell report={row} />
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
