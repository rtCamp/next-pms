import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  ComboBox,
  Spinner,
  useToast,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from "@next-pms/design-system/components";
import {
  FrappeError,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

const formatDate = (datetime: string) => {
  if (!datetime) return "";
  return new Date(datetime.replace(" ", "T")).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface PMReportRow {
  run_id: string;
  report_link?: string;
  date_range: string;
  generated_on?: string;
  status: "Generating" | "Completed" | "Failed" | "Done" | "";
}

interface PMReportProps {
  projectId: string | undefined;
}

interface PMReportEvent {
  project: string;
  doc_link?: string;
  error?: string;
}

const PMReport = ({ projectId }: PMReportProps) => {
  const { toast } = useToast();
  const { data: projectData, mutate } = useFrappeGetDoc("Project", projectId);

  const [isGenerating, setIsGenerating] = useState(false);
  const [driveLink, setDriveLink] = useState("");
  const [slackSlug, setSlackSlug] = useState("");

  const [duration, setDuration] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [slackSearch, setSlackSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isEditingSlack, setIsEditingSlack] = useState(false);

  const [selectedRepo, setSelectedRepo] = useState("");

  const [includePreviousReport, setIncludePreviousReport] = useState(false);

  const [resyncingRunId, setResyncingRunId] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mutateRef = useRef(mutate);
  const isInitializedRef = useRef(false);
  const slackSlugRef = useRef(slackSlug);
  const prevReportsRef = useRef<PMReportRow[]>([]);

  useEffect(() => {
    mutateRef.current = mutate;
  }, [mutate]);
  useEffect(() => {
    slackSlugRef.current = slackSlug;
  }, [slackSlug]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(slackSearch), 300);
    return () => clearTimeout(timer);
  }, [slackSearch]);

  const { data: channelList } = useFrappeGetDocList("Slack Channel", {
    fields: ["name", "channel_name"],
    filters: debouncedSearch
      ? [["channel_name", "like", `%${debouncedSearch}%`]]
      : [],
    orderBy: { field: "channel_name", order: "asc" },
    limit: 20,
  });

  useEffect(() => {
    if (!projectData || isInitializedRef.current) return;
    isInitializedRef.current = true;
    setDriveLink(projectData.custom_project_drive_link || "");
    setSlackSlug(projectData.custom_slack_channel_slug || "");
    const repos = projectData.custom_project_repository_connections || [];
    if (repos.length > 0) {
      setSelectedRepo(repos[0].github_repository || "");
    }
  }, [projectData]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = (data: unknown) => {
      const event = data as PMReportEvent;
      if (event.project !== projectId) return;
      mutateRef.current();
    };

    window.frappe?.realtime?.on("pm_report_ready", handler);
    return () => window.frappe?.realtime?.off("pm_report_ready", handler);
  }, [projectId]);

  const { updateDoc, loading: saving } = useFrappeUpdateDoc();
  const { call } = useFrappePostCall(
    "next_pms.api.generate_pm_report.generate_pm_report",
  );

  const reports = (projectData?.custom_project_reports ?? []) as PMReportRow[];
  const completedReports = reports.filter(
    (r) => r.status === "Done" && !!r.report_link,
  );
  const lastReportLink =
    completedReports.length > 0
      ? (completedReports[completedReports.length - 1].report_link ?? null)
      : null;
  const isCustom = duration === "Custom";
  const isAnyGenerating = reports.some((r) => r.status === "Generating");
  const isBusy = saving || isAnyGenerating;

  useEffect(() => {
    const prev = prevReportsRef.current;

    reports.forEach((r) => {
      const prevRow = prev.find((p) => p.run_id === r.run_id);

      if (prevRow?.status === "Generating" && r.status === "Done") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsGenerating(false);
        toast({
          variant: "success",
          description: "Project Report is Ready! ✅",
        });
      }

      if (prevRow?.status === "Generating" && r.status === "Failed") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsGenerating(false);
        toast({
          variant: "destructive",
          description: "Report generation failed.",
        });
      }

      if (prevRow?.status === "Generating" && r.status === "Completed") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsGenerating(false);
        toast({
          variant: "destructive",
          description: "Report completed but no document found. Click Resync.",
        });
      }
    });

    prevReportsRef.current = reports;
  }, [reports, toast]);

  useEffect(() => {
    if (!isAnyGenerating) return;
    const interval = setInterval(() => mutateRef.current(), 30000);
    return () => clearInterval(interval);
  }, [isAnyGenerating]);

  const { call: resyncCall } = useFrappePostCall(
    "next_pms.api.generate_pm_report.resync_report",
  );

  const handleDurationChange = useCallback((value: string) => {
    setDuration(value);
    if (value === "Custom") {
      setFromDate("");
      setToDate("");
      return;
    }
    const today = toLocalDateString(new Date());
    const daysMap: Record<string, number> = {
      "Last Week": 7,
      "Last 15 Days": 15,
      "Last Month": 30,
    };
    const days = daysMap[value];
    if (days) {
      const from = new Date();
      from.setDate(from.getDate() - days);
      setFromDate(toLocalDateString(from));
      setToDate(today);
    }
  }, []);

  const handleSaveAndGenerate = async () => {
    if (!duration) {
      toast({
        variant: "destructive",
        description: "Please select a Report Duration.",
      });
      return;
    }
    if (!slackSlug) {
      toast({
        variant: "destructive",
        description: "Please add a Slack Channel.",
      });
      return;
    }
    if (duration === "Custom" && (!fromDate || !toDate)) {
      toast({
        variant: "destructive",
        description: "Please set From Date and To Date for Custom duration.",
      });
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      toast({
        variant: "destructive",
        description: "From Date cannot be after To Date.",
      });
      return;
    }
    setIsGenerating(true);

    try {
      await updateDoc("Project", projectId as string, {
        custom_slack_channel_slug: slackSlug,
      });

      await call({
        project: projectId,
        from_date: fromDate,
        to_date: toDate,
        selected_repo: selectedRepo,
        ...(includePreviousReport && lastReportLink
          ? { previous_doc_url: lastReportLink }
          : {}),
      });
      mutateRef.current();

      toast({
        variant: "success",
        description: includePreviousReport
          ? "PM Report is being generated with previous report as reference. You'll be notified when ready 🔔"
          : "Project Report is being generated. You'll be notified when ready 🔔",
      });

      setDuration("");
      setFromDate("");
      setToDate("");
      setIncludePreviousReport(false);
      setSelectedRepo(
        projectData?.custom_project_repository_connections?.[0]
          ?.github_repository || "",
      );

      timeoutRef.current = setTimeout(() => {
        setIsGenerating(false);
        toast({
          variant: "destructive",
          description: "Report generation timed out. Please try again.",
        });
      }, 600000);
    } catch (error) {
      setIsGenerating(false);
      const err = error as FrappeError;
      toast({
        variant: "destructive",
        description:
          err?.message ||
          "Failed to generate Project Report. Please try again.",
      });
    }
  };

  const handleResync = async (runId: string) => {
    setResyncingRunId(runId);
    try {
      const result = await resyncCall({ project: projectId, run_id: runId });
      const status = result?.message?.status;

      if (status === "success") {
        toast({ variant: "success", description: "Report document found! ✅" });
        mutateRef.current();
      } else if (status === "timeout") {
        toast({
          variant: "destructive",
          description: "Document still not available. Try resyncing later.",
        });
      } else if (status === "failed") {
        toast({
          variant: "destructive",
          description: "Report failed during resync.",
        });
        mutateRef.current();
      } else {
        toast({
          variant: "destructive",
          description: "Document not available yet. Try again later.",
        });
      }
    } catch (error) {
      const err = error as FrappeError;
      toast({
        variant: "destructive",
        description: err?.message || "Resync failed.",
      });
    } finally {
      setResyncingRunId(null);
    }
  };

  const isGeneratingRow = (r: PMReportRow) => r.status === "Generating";
  const isFailedRow = (r: PMReportRow) => r.status === "Failed";
  const isResyncableRow = (r: PMReportRow) => r.status === "Completed";
  const getRowRunId = (r: PMReportRow) => r.run_id || null;

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Report Configuration</h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Duration */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">
              Report Duration
            </label>
            <Select
              value={duration}
              onValueChange={(value) => handleDurationChange(value)}
              disabled={isBusy}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Last Week">Last Week</SelectItem>
                <SelectItem value="Last 15 Days">Last 15 Days</SelectItem>
                <SelectItem value="Last Month">Last Month</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Slack Channel */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">
              Slack Channel
            </label>
            <div className="flex gap-2 items-center">
              {isEditingSlack ? (
                <>
                  <div className="flex-1">
                    <ComboBox
                      label="Search Slack Channel"
                      data={(channelList ?? []).map((ch) => ({
                        label: ch.channel_name,
                        value: ch.name,
                      }))}
                      onSelect={(value) => {
                        const selected = Array.isArray(value)
                          ? value[0]
                          : value;
                        slackSlugRef.current = selected;
                        setSlackSlug(selected);
                      }}
                      onSearch={(search) => setSlackSearch(search)}
                      isLoading={false}
                      disabled={isBusy}
                      className="w-full"
                      showSelected={true}
                    />
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      const slugToSave = slackSlugRef.current;
                      if (!slugToSave) {
                        toast({
                          variant: "destructive",
                          description: "Please select a Slack channel.",
                        });
                        return;
                      }
                      try {
                        await updateDoc("Project", projectId as string, {
                          custom_slack_channel_slug: slugToSave,
                        });
                        setSlackSlug(slugToSave);
                        setSlackSearch("");
                        setDebouncedSearch("");
                        setIsEditingSlack(false);
                        toast({
                          variant: "success",
                          description: "Slack channel saved.",
                        });
                      } catch (error) {
                        const err = error as FrappeError;
                        toast({
                          variant: "destructive",
                          description:
                            err?.message ||
                            "Failed to save Slack channel. Please try again.",
                        });
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const original =
                        projectData?.custom_slack_channel_slug || "";
                      slackSlugRef.current = original;
                      setSlackSlug(original);
                      setSlackSearch("");
                      setDebouncedSearch("");
                      setIsEditingSlack(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    type="text"
                    className="flex-1 bg-muted text-muted-foreground cursor-not-allowed"
                    value={slackSlug || "Not set"}
                    readOnly
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingSlack(true)}
                    disabled={isBusy}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* From Date */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">
              Report From Date
            </label>
            <Input
              type="date"
              className={`${!isCustom ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}`}
              value={fromDate}
              onChange={(e) => {
                if (isCustom) setFromDate(e.target.value);
              }}
              disabled={isBusy}
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">
              Report To Date
            </label>
            <Input
              type="date"
              className={`${!isCustom ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}`}
              value={toDate}
              onChange={(e) => {
                if (isCustom) setToDate(e.target.value);
              }}
              disabled={isBusy}
            />
          </div>

          {/* Repository */}
          {(projectData?.custom_project_repository_connections ?? []).length >
            0 && (
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm text-muted-foreground">
                GitHub Repository
              </label>
              <Select
                value={selectedRepo}
                onValueChange={(value) => setSelectedRepo(value)}
                disabled={isBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select repository..." />
                </SelectTrigger>
                <SelectContent>
                  {(
                    projectData?.custom_project_repository_connections ?? []
                  ).map((repo: { github_repository: string }) => {
                    const repoName =
                      (repo.github_repository || "")
                        .replace(/\/$/, "")
                        .split("/")
                        .pop() || repo.github_repository;
                    return (
                      <SelectItem
                        key={repo.github_repository}
                        value={repo.github_repository}
                      >
                        {repoName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Drive Link — readonly */}
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-sm text-muted-foreground">
              Report Drive Link
            </label>
            <Input
              type="url"
              className="bg-muted text-muted-foreground cursor-not-allowed"
              value={driveLink}
              readOnly
              placeholder="https://drive.google.com/..."
            />
          </div>

          {lastReportLink && (
            <div className="flex items-center gap-2 col-span-2">
              <input
                type="checkbox"
                id="includePreviousReport"
                checked={includePreviousReport}
                onChange={(e) => setIncludePreviousReport(e.target.checked)}
                disabled={isBusy}
                className="h-4 w-4 cursor-pointer"
              />
              <label
                htmlFor="includePreviousReport"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Include previous report as reference
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 mt-2">
          <Button onClick={handleSaveAndGenerate} disabled={isBusy}>
            {isBusy ? (
              <>
                <Spinner className="mr-2" />
                Generating...
              </>
            ) : (
              "Generate Project Report"
            )}
          </Button>
          {isGenerating && (
            <p className="text-sm text-muted-foreground">
              ⏳ Report is being generated. You'll be notified when ready...
            </p>
          )}
        </div>
      </div>

      {/* Reports History */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Project Reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reports generated yet.
          </p>
        ) : (
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 w-8">#</th>
                  <th className="text-left px-4 py-2">Report Link</th>
                  <th className="text-left px-4 py-2">Date Range</th>
                  <th className="text-left px-4 py-2">Generated On</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => {
                  const generating = isGeneratingRow(report);
                  const failed = isFailedRow(report);
                  const resyncable = isResyncableRow(report);
                  const runId = getRowRunId(report);

                  return (
                    <tr
                      key={report.run_id || `report-${index}`}
                      className={`border-t hover:bg-muted/50 ${
                        generating
                          ? "bg-yellow-50"
                          : failed || resyncable
                            ? "bg-red-50"
                            : ""
                      }`}
                    >
                      <td className="px-4 py-2">{index + 1}</td>

                      <td className="px-4 py-2">
                        {generating && (
                          <span className="text-yellow-600 text-sm flex items-center gap-2">
                            <Spinner className="w-3 h-3" /> Generating...
                          </span>
                        )}
                        {failed && (
                          <span className="text-red-600 text-sm">
                            ❌ Failed
                          </span>
                        )}
                        {resyncable && runId && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResync(runId)}
                              disabled={resyncingRunId === runId}
                            >
                              {resyncingRunId === runId ? (
                                <>
                                  <Spinner className="mr-1 w-3 h-3" />{" "}
                                  Resyncing...
                                </>
                              ) : (
                                "🔄 Resync"
                              )}
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              Report completed but document not found. Click
                              Resync to check again.
                            </span>
                          </div>
                        )}
                        {!generating && !failed && !resyncable && (
                          <a
                            href={report.report_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                          >
                            View Report
                          </a>
                        )}
                      </td>

                      <td className="px-4 py-2">{report.date_range}</td>

                      <td className="px-4 py-2">
                        {/* Always show timestamp if available */}
                        <span>
                          {report.generated_on
                            ? formatDate(report.generated_on)
                            : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PMReport;
