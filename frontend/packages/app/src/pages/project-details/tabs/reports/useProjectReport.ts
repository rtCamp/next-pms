/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { format, subDays } from "date-fns";
import {
  FrappeError,
  useFrappeEventListener,
  useFrappeGetCall,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "../../context";
import type { ProjectReportRow } from "../../types";
import {
  DURATION_CUSTOM,
  DURATION_DAYS,
  GENERATE_TIMEOUT_MS,
} from "./constants";
import type { PMReportEvent } from "./types";

const toDateString = (date: Date) => format(date, "yyyy-MM-dd");

const repoShortName = (url: string) =>
  url.replace(/\/$/, "").split("/").pop() || url;

export function useProjectReport() {
  const { project, projectId, mutate } = useProjectDetail((state) => state);
  const toast = useToasts();
  const { updateDoc, loading: saving } = useFrappeUpdateDoc();
  const { call: generateReport } = useFrappePostCall(
    "next_pms.api.generate_pm_report.generate_pm_report",
  );

  const [duration, setDuration] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [includePreviousReport, setIncludePreviousReport] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevReportsRef = useRef<ProjectReportRow[]>([]);
  const repoInitRef = useRef(false);

  const reports = useMemo(
    () => (project?.custom_project_reports ?? []) as ProjectReportRow[],
    [project?.custom_project_reports],
  );

  const repoOptions = useMemo(
    () =>
      (project?.custom_project_repository_connections ?? [])
        .map((repo) => repo.github_repository)
        .filter((url): url is string => Boolean(url))
        .map((url) => ({ label: repoShortName(url), value: url })),
    [project?.custom_project_repository_connections],
  );

  const driveLink = project?.custom_project_drive_link ?? "";
  const completedReports = reports.filter(
    (report) => report.status === "Done" && !!report.report_link,
  );
  const lastReportLink = completedReports.at(-1)?.report_link ?? null;
  const isCustom = duration === DURATION_CUSTOM;
  const isAnyGenerating = reports.some(
    (report) => report.status === "Generating",
  );
  const isBusy = saving || isAnyGenerating || isGenerating;

  const { data: boardData } = useFrappeGetCall<{ message: string[] }>(
    "next_pms.api.generate_pm_report.get_repository_project_boards",
    { repository: selectedRepo },
    selectedRepo ? `project-boards:${selectedRepo}` : null,
  );
  const boardOptions = useMemo(
    () =>
      (boardData?.message ?? []).map((name) => ({ label: name, value: name })),
    [boardData],
  );

  useEffect(() => {
    if (repoInitRef.current || repoOptions.length === 0) return;
    repoInitRef.current = true;
    setSelectedRepo(repoOptions[0].value);
  }, [repoOptions]);

  useEffect(() => {
    if (boardOptions.length === 0) {
      setSelectedBoard("");
      return;
    }
    setSelectedBoard((prev) =>
      prev && boardOptions.some((option) => option.value === prev)
        ? prev
        : boardOptions[0].value,
    );
  }, [boardOptions]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useFrappeEventListener("pm_report_ready", (payload) => {
    const event = payload?.message as PMReportEvent | undefined;
    if (!event || event.project !== projectId) return;
    mutate();
  });

  useEffect(() => {
    if (!isAnyGenerating) return;
    const interval = setInterval(() => mutate(), 30000);
    return () => clearInterval(interval);
  }, [isAnyGenerating, mutate]);

  useEffect(() => {
    const previous = prevReportsRef.current;
    reports.forEach((report) => {
      const before = previous.find((row) => row.run_id === report.run_id);
      if (before?.status !== "Generating") return;
      if (report.status === "Done") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsGenerating(false);
        toast.success("Project Report is ready");
      } else if (report.status === "Failed") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsGenerating(false);
        toast.error("Report generation failed");
      } else if (report.status === "Completed") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsGenerating(false);
        toast.error("Report completed but no document was generated");
      }
    });
    prevReportsRef.current = reports;
  }, [reports, toast]);

  const handleDurationChange = useCallback((value: string) => {
    setDuration(value);
    if (value === DURATION_CUSTOM || !value) {
      setFromDate("");
      setToDate("");
      return;
    }
    const days = DURATION_DAYS[value];
    if (days) {
      setFromDate(toDateString(subDays(new Date(), days)));
      setToDate(toDateString(new Date()));
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!duration) {
      toast.error("Please select a Report Duration");
      return;
    }
    if (!project?.custom_slack_channel_slug) {
      toast.error("Please add a Slack Channel");
      return;
    }
    if (isCustom && (!fromDate || !toDate)) {
      toast.error("Please set From Date and To Date for Custom duration");
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      toast.error("From Date cannot be after To Date");
      return;
    }

    setIsGenerating(true);
    try {
      await generateReport({
        project: projectId,
        from_date: fromDate,
        to_date: toDate,
        selected_repo: selectedRepo,
        selected_board: selectedBoard,
        ...(includePreviousReport && lastReportLink
          ? { previous_doc_url: lastReportLink }
          : {}),
      });
      mutate();
      toast.success(
        includePreviousReport
          ? "Report is being generated with the previous report as reference"
          : "Report is being generated. You'll be notified when it's ready",
      );
      setDuration("");
      setFromDate("");
      setToDate("");
      setIncludePreviousReport(false);
      timeoutRef.current = setTimeout(() => {
        setIsGenerating(false);
        toast.error("Report generation timed out. Please try again");
      }, GENERATE_TIMEOUT_MS);
    } catch (error) {
      setIsGenerating(false);
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
  }, [
    duration,
    project?.custom_slack_channel_slug,
    isCustom,
    fromDate,
    toDate,
    generateReport,
    projectId,
    selectedRepo,
    selectedBoard,
    includePreviousReport,
    lastReportLink,
    mutate,
    toast,
  ]);

  return {
    reports,
    driveLink,
    duration,
    fromDate,
    toDate,
    isCustom,
    selectedRepo,
    selectedBoard,
    repoOptions,
    boardOptions,
    includePreviousReport,
    lastReportLink,
    isBusy,
    setFromDate,
    setToDate,
    setSelectedRepo,
    setSelectedBoard,
    setIncludePreviousReport,
    handleDurationChange,
    handleGenerate,
  };
}
