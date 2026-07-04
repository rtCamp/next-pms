/**
 * External dependencies.
 */
import type { PropsWithChildren } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Select,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { Calendar } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import { DURATION_OPTIONS } from "./constants";
import { SlackChannelField } from "./slackChannelField";
import type { useProjectReport } from "./useProjectReport";

interface ReportConfigurationProps {
  report: ReturnType<typeof useProjectReport>;
}

function Field({
  label,
  className,
  children,
}: PropsWithChildren<{ label: string; className?: string }>) {
  return (
    <div className={mergeClassNames("flex flex-col gap-1.5", className)}>
      <label className="block text-base text-ink-gray-5">{label}</label>
      {children}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <DatePicker
        label={label}
        value={value}
        onChange={(next) => onChange(next as string)}
        placeholder="Select date"
        disabled={disabled}
      >
        {({ displayValue }) => (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between gap-2 shrink-0 text-ink-gray-7"
            iconRight={() => <Calendar className="size-4 shrink-0" />}
          >
            <span className="whitespace-nowrap mr-2">
              {displayValue || "Select date"}
            </span>
          </Button>
        )}
      </DatePicker>
    </Field>
  );
}

export function ReportConfiguration({ report }: ReportConfigurationProps) {
  const {
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
  } = report;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-ink-gray-8">
        Report Configuration
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Report Duration">
          <Select
            value={duration}
            onChange={(value) => handleDurationChange(value ?? "")}
            options={DURATION_OPTIONS}
            placeholder="Select…"
            disabled={isBusy}
          />
        </Field>

        <Field label="Slack Channel">
          <SlackChannelField disabled={isBusy} />
        </Field>

        <DateField
          label="Report From Date"
          value={fromDate}
          onChange={setFromDate}
          disabled={!isCustom || isBusy}
        />
        <DateField
          label="Report To Date"
          value={toDate}
          onChange={setToDate}
          disabled={!isCustom || isBusy}
        />

        {repoOptions.length > 0 && (
          <Field label="GitHub Repository" className="col-span-2">
            <Select
              value={selectedRepo}
              onChange={(value) => setSelectedRepo(value ?? "")}
              options={repoOptions}
              placeholder="Select repository…"
              disabled={isBusy}
            />
          </Field>
        )}

        {boardOptions.length > 0 && (
          <Field label="Project Board" className="col-span-2">
            <Select
              value={selectedBoard}
              onChange={(value) => setSelectedBoard(value ?? "")}
              options={boardOptions}
              placeholder="Select project board…"
              disabled={isBusy}
            />
          </Field>
        )}

        <Field label="Report Drive Link" className="col-span-2">
          <TextInput
            value={driveLink}
            disabled
            placeholder="https://drive.google.com/…"
          />
        </Field>

        {lastReportLink && (
          <div className="col-span-2">
            <Checkbox
              htmlId="includePreviousReport"
              label="Include previous report as reference"
              value={includePreviousReport}
              onChange={setIncludePreviousReport}
              disabled={isBusy}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          variant="solid"
          onClick={handleGenerate}
          loading={isBusy}
          disabled={isBusy}
        >
          Generate Project Report
        </Button>
      </div>
    </section>
  );
}
