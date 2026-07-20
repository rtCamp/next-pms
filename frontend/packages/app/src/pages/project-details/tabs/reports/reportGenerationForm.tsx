/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { formatDateRange } from "@next-pms/design-system/date";
import {
  Button,
  Checkbox,
  DateRangePicker,
  Select,
  TextInput,
  Tooltip,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { Calendar } from "@rtcamp/frappe-ui-react/icons";
import { useForm } from "@tanstack/react-form";
import {
  FrappeError,
  useFrappeEventListener,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { getDurationPresets } from "./constants";
import { Field } from "./field";
import { ProjectBoardField } from "./projectBoardField";
import { SlackChannelField } from "./slackChannelField";
import { useProjectDetail } from "../../context";

const repoShortName = (url: string) =>
  url.replace(/\/$/, "").split("/").pop() || url;

const defaultValues = {
  dateRange: ["", ""] as string[],
  githubRepository: "",
  projectBoard: "",
  driveLink: "",
  includePreviousReport: false,
};

export function ReportGenerationForm() {
  const toast = useToasts();
  const projectId = useProjectDetail((state) => state.projectId);
  const { call: generateReport } = useFrappePostCall(
    "next_pms.api.generate_pm_report.generate_pm_report",
  );
  const repositoryConnections = useProjectDetail(
    (state) => state.project?.custom_project_repository_connections,
  );
  const driveLink = useProjectDetail(
    (state) => state.project?.custom_project_drive_link ?? "",
  );
  const reports = useProjectDetail(
    (state) => state.project?.custom_project_reports ?? [],
  );
  const mutate = useProjectDetail((state) => state.mutate);
  const isReportGenerating = reports.some(
    (report) => report.status === "Generating",
  );

  // Listen for real-time PM report status updates from the backend to refresh project details
  const handleReportReady = useCallback(
    (message?: { project?: string }) => {
      if (message?.project !== projectId) return;
      mutate();
    },
    [projectId, mutate],
  );

  useFrappeEventListener("pm_report_ready", handleReportReady);

  // Safety net: poll every 30s while any report is Generating (in case WebSocket event is missed)
  useEffect(() => {
    if (!isReportGenerating) return;
    const interval = setInterval(() => mutate(), 30000);
    return () => clearInterval(interval);
  }, [isReportGenerating, mutate]);

  const prevReportStatusesRef = useRef<Record<string, string>>({});
  const toastedRunIdsRef = useRef<Record<string, boolean>>({});

  // Compare report history updates to trigger completion/failure toasts
  useEffect(() => {
    reports.forEach((report) => {
      if (!report.run_id) return;
      const prevStatus = prevReportStatusesRef.current[report.run_id];

      if (
        prevStatus !== "Generating" ||
        toastedRunIdsRef.current[report.run_id]
      ) {
        return;
      }

      if (report.status === "Done") {
        toastedRunIdsRef.current[report.run_id] = true;
        toast.success("Project Report is Ready! ✅");
      } else if (report.status === "Failed") {
        toastedRunIdsRef.current[report.run_id] = true;
        toast.error("Report generation failed.");
      } else if (report.status === "Completed") {
        toastedRunIdsRef.current[report.run_id] = true;
        toast.error("Generation completed — Resync to get the document URL.");
      }
    });

    // Save current statuses map to ref (avoids in-place reference mutation bugs)
    const nextStatuses: Record<string, string> = {};
    reports.forEach((r) => {
      if (r.run_id) {
        nextStatuses[r.run_id] = r.status ?? "";
      }
    });
    prevReportStatusesRef.current = nextStatuses;
  }, [reports, toast]);

  const previousReportUrl = useMemo(() => {
    for (let index = reports.length - 1; index >= 0; index--) {
      if (reports[index].report_link) {
        return reports[index].report_link ?? "";
      }
    }
    return "";
  }, [reports]);
  const durationPresets = useMemo(() => getDurationPresets(), []);
  const repositoryOptions = useMemo(
    () =>
      (repositoryConnections ?? [])
        .map((repo) => repo.github_repository)
        .filter((url): url is string => Boolean(url))
        .map((url) => ({ label: repoShortName(url), value: url })),
    [repositoryConnections],
  );

  const form = useForm({
    defaultValues: { ...defaultValues, driveLink },
    onSubmit: async ({ value }) => {
      try {
        await generateReport({
          project: projectId,
          from_date: value.dateRange[0],
          to_date: value.dateRange[1],
          selected_repo: value.githubRepository,
          selected_board: value.projectBoard,
          previous_doc_url:
            value.includePreviousReport && previousReportUrl
              ? previousReportUrl
              : undefined,
        });
        // Refetch project data to reflect the new report row in 'Generating' state
        mutate();
        toast.success(
          "Report is being generated. You'll be notified when it's ready",
        );
      } catch (error) {
        toast.error(parseFrappeErrorMsg(error as FrappeError));
      }
    },
  });

  useEffect(() => {
    form.setFieldValue("driveLink", driveLink);
  }, [driveLink, form]);

  useEffect(() => {
    if (repositoryOptions.length === 0 || form.state.values.githubRepository) {
      return;
    }
    form.setFieldValue("githubRepository", repositoryOptions[0].value);
  }, [repositoryOptions, form]);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <h2 className="text-xl font-semibold text-ink-gray-8">
        Report Configuration
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="dateRange"
          children={(field) => (
            <Field label="Report Duration">
              <DateRangePicker
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                formatter={formatDateRange}
                placeholder="Select duration"
                footer={({ setRange, close }) => (
                  <div className="flex flex-wrap items-center gap-1">
                    {durationPresets.map((preset) => (
                      <Button
                        key={preset.label}
                        size="sm"
                        variant="ghost"
                        className="text-sm text-ink-gray-7"
                        onClick={() => {
                          setRange(preset.range[0], preset.range[1]);
                          close();
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                )}
              >
                {({ displayValue }) => (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between gap-2 shrink-0 text-ink-gray-7"
                    iconRight={() => <Calendar className="size-4 shrink-0" />}
                  >
                    <span className="whitespace-nowrap mr-2">
                      {displayValue || "Select duration"}
                    </span>
                  </Button>
                )}
              </DateRangePicker>
            </Field>
          )}
        />

        <SlackChannelField />

        <form.Field
          name="githubRepository"
          children={(field) => (
            <Field label="GitHub Repository" className="col-span-2">
              <Select
                variant="outline"
                className="text-ink-gray-7"
                value={field.state.value}
                onChange={(value) => field.handleChange(value ?? "")}
                options={repositoryOptions}
                placeholder="Select repository…"
              />
            </Field>
          )}
        />

        <form.Subscribe
          selector={(state) => state.values.githubRepository}
          children={(selectedRepository) => (
            <form.Field
              name="projectBoard"
              children={(field) => (
                <ProjectBoardField
                  repository={selectedRepository}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            />
          )}
        />

        <form.Field
          name="driveLink"
          children={(field) => (
            <Field label="Report Drive Link" className="col-span-2">
              <TextInput
                variant="outline"
                value={field.state.value}
                disabled
                placeholder="Not set"
              />
            </Field>
          )}
        />

        <form.Field
          name="includePreviousReport"
          children={(field) => (
            <div className="col-span-2">
              <Checkbox
                htmlId="includePreviousReport"
                label="Include previous report as reference"
                value={field.state.value}
                onChange={field.handleChange}
              />
            </div>
          )}
        />
      </div>

      <div className="flex justify-end">
        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <Tooltip
              text="A report is currently being generated"
              disabled={!isReportGenerating}
            >
              <span>
                <Button
                  type="submit"
                  variant="solid"
                  loading={isSubmitting}
                  disabled={isSubmitting || isReportGenerating}
                >
                  Generate Project Report
                </Button>
              </span>
            </Tooltip>
          )}
        />
      </div>
    </form>
  );
}
