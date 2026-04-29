import { useCallback, useEffect, useRef, useState } from "react";
import {
  FrappeError,
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";
import { Button, ComboBox, Spinner, useToast } from "@next-pms/design-system/components";

const formatDate = (datetime: string) => {
  if (!datetime) return "";
  return new Date(datetime).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

interface PMReportRow {
  report_link: string;
  date_range: string;
  generated_on: string;
}

interface PMReportProps {
  projectId: string | undefined;
}

const PMReport = ({ projectId }: PMReportProps) => {
  const { toast } = useToast();
  const { data: projectData, mutate } = useFrappeGetDoc("Project", projectId);

  const [isGenerating, setIsGenerating] = useState(false);
  const [driveLink, setDriveLink]       = useState("");
  const [slackSlug, setSlackSlug]       = useState("");

  const [duration, setDuration] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate]     = useState("");

  const [slackSearch, setSlackSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isEditingSlack, setIsEditingSlack]  = useState(false);

  const [includePreviousReport, setIncludePreviousReport] = useState(false);

  const timeoutRef       = useRef<NodeJS.Timeout | null>(null);
  const prevCountRef     = useRef(0);
  const mutateRef        = useRef(mutate);
  const isInitializedRef = useRef(false);
  const slackSlugRef     = useRef(slackSlug);

  useEffect(() => { mutateRef.current = mutate; }, [mutate]);
  useEffect(() => { slackSlugRef.current = slackSlug; }, [slackSlug]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(slackSearch), 300);
    return () => clearTimeout(timer);
  }, [slackSearch]);

  const { data: channelList } = useFrappeGetDocList("Slack Channel", {
    fields: ["name", "channel_name"],
    filters: debouncedSearch ? [["channel_name", "like", `%${debouncedSearch}%`]] : [],
    orderBy: { field: "channel_name", order: "asc" },
    limit: 20,
  });

  useEffect(() => {
    if (!projectData || isInitializedRef.current) return;
    isInitializedRef.current = true;
    setDriveLink(projectData.custom_project_drive_link || "");
    setSlackSlug(projectData.custom_slack_channel_slug || "");
  }, [projectData]);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  useEffect(() => {
    const handler = (data: any) => {
      if (data.project !== projectId) return;
      if (data.error) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsGenerating(false);
        toast({ variant: "destructive", description: data.error });
        return;
      }
      mutateRef.current();
    };

    window.frappe?.realtime?.on("pm_report_ready", handler);
    return () => window.frappe?.realtime?.off("pm_report_ready", handler);
  }, [projectId]);

  useEffect(() => {
    if (!isGenerating) return;
    const currentCount = projectData?.custom_project_reports?.length ?? 0;
    if (currentCount > prevCountRef.current) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsGenerating(false);
      toast({ variant: "success", description: "Project Report is Ready! ✅" });
    }
  }, [projectData?.custom_project_reports?.length, isGenerating]);

  const { updateDoc, loading: saving } = useFrappeUpdateDoc();
  const { call } = useFrappePostCall("next_pms.api.generate_pm_report.generate_pm_report");

  const handleDurationChange = useCallback((value: string) => {
    setDuration(value);
    if (value === "Custom") { setFromDate(""); setToDate(""); return; }
    const today = new Date().toISOString().split("T")[0];
    const daysMap: Record<string, number> = {
      "Last Week": 7, "Last 15 Days": 15, "Last Month": 30,
    };
    const days = daysMap[value];
    if (days) {
      const from = new Date();
      from.setDate(from.getDate() - days);
      setFromDate(from.toISOString().split("T")[0]);
      setToDate(today);
    }
  }, []);

  const handleSaveAndGenerate = async () => {
    if (!duration) {
      toast({ variant: "destructive", description: "Please select a Report Duration." }); return;
    }
    if (!slackSlug) {
      toast({ variant: "destructive", description: "Please add a Slack Channel." }); return;
    }
    if (duration === "Custom" && (!fromDate || !toDate)) {
      toast({ variant: "destructive", description: "Please set From Date and To Date for Custom duration." }); return;
    }

    prevCountRef.current = projectData?.custom_project_reports?.length ?? 0;
    setIsGenerating(true);

    try {
      await updateDoc("Project", projectId as string, {
        custom_project_drive_link: driveLink,
        custom_slack_channel_slug: slackSlug,
      });

      await call({
        project: projectId,
        from_date: fromDate,
        to_date: toDate,
        ...(includePreviousReport && lastReportLink
          ? { previous_doc_url: lastReportLink }
          : {}
        ),
      });

      toast({ 
        variant: "success", 
        description: includePreviousReport 
          ? "PM Report is being generated with previous report as reference. You'll be notified when ready 🔔" 
          : "Project Report is being generated. You'll be notified when ready 🔔"
      });

      setDuration("");
      setFromDate("");
      setToDate("");
      setIncludePreviousReport(false);

      timeoutRef.current = setTimeout(() => {
        setIsGenerating(false);
        toast({ variant: "destructive", description: "Report generation timed out. Please try again." });
      }, 600000);

    } catch (error) {
      setIsGenerating(false);
      const err = error as FrappeError;
      toast({ variant: "destructive", description: err?.message || "Failed to generate Project Report. Please try again." });
    }
  };

  const reports  = (projectData?.custom_project_reports ?? []) as PMReportRow[];
  const lastReportLink = reports.length > 0 ? reports[reports.length - 1].report_link : null;
  const isCustom = duration === "Custom";
  const isBusy   = isGenerating || saving;

  return (
    <div className="flex flex-col gap-6 p-4">

      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Report Configuration</h2>

        <div className="grid grid-cols-2 gap-4">

          {/* Duration */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Report Duration</label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={duration}
              onChange={(e) => handleDurationChange(e.target.value)}
              disabled={isBusy}
            >
              <option value="">Select...</option>
              <option value="Last Week">Last Week</option>
              <option value="Last 15 Days">Last 15 Days</option>
              <option value="Last Month">Last Month</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Slack Channel */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Slack Channel</label>
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
                        const selected = Array.isArray(value) ? value[0] : value;
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
                  <button
                    className="p-2 rounded hover:bg-muted"
                    onClick={async () => {
                      const slugToSave = slackSlugRef.current;
                      if (!slugToSave) {
                        toast({ variant: "destructive", description: "Please select a Slack channel." });
                        return;
                      }
                      await updateDoc("Project", projectId as string, {
                        custom_slack_channel_slug: slugToSave,
                      });
                      setSlackSlug(slugToSave);
                      setSlackSearch("");
                      setDebouncedSearch("");
                      setIsEditingSlack(false);
                      toast({ variant: "success", description: "Slack channel saved." });
                    }}
                  >
                    ✅
                  </button>
                  <button
                    className="p-2 rounded hover:bg-muted text-muted-foreground"
                    onClick={() => {
                      const original = projectData?.custom_slack_channel_slug || "";
                      slackSlugRef.current = original;
                      setSlackSlug(original);
                      setSlackSearch("");
                      setDebouncedSearch("");
                      setIsEditingSlack(false);
                    }}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    className="border rounded px-3 py-2 text-sm flex-1 bg-muted text-muted-foreground cursor-not-allowed"
                    value={slackSlug || "Not set"}
                    readOnly
                  />
                  <button
                    className="p-2 rounded hover:bg-muted"
                    onClick={() => setIsEditingSlack(true)}
                    disabled={isBusy}
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          </div>

          {/* From Date */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Report From Date</label>
            <input
              type="date"
              className={`border rounded px-3 py-2 text-sm ${!isCustom ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}`}
              value={fromDate}
              onChange={(e) => { if (isCustom) setFromDate(e.target.value); }}
              disabled={isBusy}
            />
          </div>

          {/* To Date */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Report To Date</label>
            <input
              type="date"
              className={`border rounded px-3 py-2 text-sm ${!isCustom ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}`}
              value={toDate}
              onChange={(e) => { if (isCustom) setToDate(e.target.value); }}
              disabled={isBusy}
            />
          </div>

          {/* Drive Link — readonly */}
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-sm text-muted-foreground">Report Drive Link</label>
            <input
              type="url"
              className="border rounded px-3 py-2 text-sm bg-muted text-muted-foreground cursor-not-allowed"
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
              <label htmlFor="includePreviousReport" className="text-sm text-muted-foreground cursor-pointer">
                Include previous report as reference
              </label>
            </div>
        )}

        </div>

        <div className="flex flex-col items-end gap-2 mt-2">
          <Button onClick={handleSaveAndGenerate} disabled={isBusy}>
            {isBusy ? <><Spinner className="mr-2" />Generating...</> : "Generate Project Report"}
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
          <p className="text-sm text-muted-foreground">No reports generated yet.</p>
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
                {reports.map((report, index) => (
                  <tr
                    key={`${report.report_link}-${index}`}
                    className={`border-t hover:bg-muted/50 ${index === reports.length - 1 ? "bg-primary/5 font-medium" : ""}`}
                  >
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">
                      <a href={report.report_link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        View Report
                      </a>
                    </td>
                    <td className="px-4 py-2">{report.date_range}</td>
                    <td className="px-4 py-2">{formatDate(report.generated_on)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default PMReport;