/**
 * External dependencies.
 */
import { useState } from "react";
import {
  Button,
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";
import { format, parseISO } from "date-fns";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { mergeClassNames, parseFrappeErrorMsg } from "@/lib/utils";
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

const isGeneratingRow = (r: ProjectReportRow) => r.status === "Generating";
const isFailedRow = (r: ProjectReportRow) => r.status === "Failed";
const isResyncableRow = (r: ProjectReportRow) => r.status === "Completed";
const isDoneRow = (r: ProjectReportRow) =>
  r.status === "Done" && !!r.report_link;

function StatusCell({ report }: { report: ProjectReportRow }) {
  if (isGeneratingRow(report)) {
    return (
      <span className="flex items-center gap-2 text-amber-600">
        <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        Generating...
      </span>
    );
  }
  if (isFailedRow(report)) {
    return <span className="text-red-600">❌ Failed</span>;
  }
  if (isResyncableRow(report)) {
    return (
      <span className="text-amber-600 text-sm font-medium">
        ⚠ Completed — Resync to get URL
      </span>
    );
  }
  return <span className="truncate">{report.status}</span>;
}

function ReportActionCell({
  report,
  isResyncing,
  onResync,
}: {
  report: ProjectReportRow;
  isResyncing: boolean;
  onResync: () => void;
}) {
  if (isDoneRow(report)) {
    return (
      <Button
        variant="ghost"
        label="View Report"
        icon={ArrowUpRight}
        link={report.report_link}
      />
    );
  }

  if (isResyncableRow(report)) {
    return (
      <Button
        variant="subtle"
        label={isResyncing ? "Resyncing..." : "🔄 Resync"}
        loading={isResyncing}
        onClick={onResync}
      />
    );
  }

  return null;
}

export function ReportsTable({ reports }: ReportsTableProps) {
  const [resyncingRunId, setResyncingRunId] = useState<string | null>(null);
  const toast = useToasts();
  const projectId = useProjectDetail((state) => state.projectId);
  const mutate = useProjectDetail((state) => state.mutate);
  const { call: resyncCall } = useFrappePostCall(
    "next_pms.api.generate_pm_report.resync_report",
  );

  const handleResync = async (runId: string) => {
    if (!projectId) return;
    setResyncingRunId(runId);
    try {
      const result = await resyncCall({
        project: projectId,
        run_id: runId,
      });
      const status = result?.message?.status;

      if (status === "success") {
        toast.success("Report document found! ✅");
        mutate();
      } else if (status === "timeout") {
        toast.error("Document still not available. Try resyncing later.");
      } else if (status === "failed") {
        toast.error("Report failed during resync.");
        mutate();
      } else {
        toast.error("Document not available yet. Try again later.");
      }
    } catch (error) {
      toast.error(
        parseFrappeErrorMsg(error as FrappeError) || "Resync failed.",
      );
    } finally {
      setResyncingRunId(null);
    }
  };

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
              <ListRow
                key={row.id}
                row={row}
                className={mergeClassNames("gap-4", {
                  "bg-amber-50": isGeneratingRow(row),
                  "bg-red-50": isFailedRow(row) || isResyncableRow(row),
                })}
              >
                {REPORT_COLUMNS.map((column) => (
                  <div
                    key={column.key}
                    className={mergeClassNames(
                      "flex items-center text-base text-ink-gray-7",
                      { "justify-end": column.align === "right" },
                    )}
                  >
                    {column.key === "reportLink" ? (
                      <ReportActionCell
                        report={row}
                        isResyncing={resyncingRunId === row.run_id}
                        onResync={() => handleResync(row.run_id)}
                      />
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
