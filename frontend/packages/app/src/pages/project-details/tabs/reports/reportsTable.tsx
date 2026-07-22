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
  Spinner,
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

function StatusCell({ report }: { report: ProjectReportRow }) {
  if (report.status === "Generating") {
    return (
      <span className="flex items-center gap-2 text-amber-600">
        <Spinner className="h-3.5 w-3.5 text-amber-600" />
        Generating...
      </span>
    );
  }
  if (report.status === "Failed") {
    return <span className="text-red-600">Failed</span>;
  }
  if (report.status === "Completed" && Boolean(report.run_id)) {
    return (
      <span className="text-amber-600 text-sm font-medium">
        Resync to get doc URL
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

  if (report.status === "Completed" && Boolean(report.run_id)) {
    return (
      <Button
        variant="subtle"
        label={isResyncing ? "Resyncing..." : "Resync"}
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

  const handleResync = async (runId?: string) => {
    if (!projectId || !runId) return;
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
                      <ReportActionCell
                        report={row}
                        isResyncing={
                          Boolean(row.run_id) && resyncingRunId === row.run_id
                        }
                        onResync={() => {
                          if (row.run_id) {
                            handleResync(row.run_id);
                          }
                        }}
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
