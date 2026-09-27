/**
 * External dependencies.
 */
import { StaticTextEditor } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import {
  currencyFormat,
  formatProjectDate,
  getDefaultCurrency,
} from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import type { GrowthDetail } from "../types";

interface GrowthDetailContentProps {
  growth: GrowthDetail;
}

const EDITOR_CLASS =
  "prose prose-sm w-full max-w-full text-ink-gray-7 leading-normal";

export function GrowthDetailContent({ growth }: GrowthDetailContentProps) {
  const currency = useProjectDetail(
    (s) => s.project?.custom_currency || getDefaultCurrency(),
  );

  const details = [
    { label: "Category", value: growth.category ?? "—" },
    {
      label: "Ideation date",
      value: growth.ideation_date
        ? formatProjectDate(growth.ideation_date)
        : "—",
    },
    {
      label: "Billable outcome",
      value: currencyFormat(currency).format(growth.billable_outcome ?? 0),
    },
    {
      label: "Last updated",
      value: formatProjectDate(growth.modified.slice(0, 10)),
    },
  ];

  return (
    <div>
      <section className="mb-5">
        {growth.description ? (
          <StaticTextEditor
            content={growth.description}
            editorClass={EDITOR_CLASS}
          />
        ) : (
          <p className="text-sm text-ink-gray-5">No description provided.</p>
        )}
      </section>

      <section className="mb-4.5">
        <h3 className="mb-2 text-lg font-medium text-ink-gray-7">
          Desired outcome / ROI
        </h3>
        {growth.desired_outcome ? (
          <StaticTextEditor
            content={growth.desired_outcome}
            editorClass={EDITOR_CLASS}
          />
        ) : (
          <p className="text-sm text-ink-gray-5">
            No desired outcome provided.
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-lg font-medium text-ink-gray-7">Details</h3>
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-base">
          {details.map(({ label, value }) => (
            <div key={label} className="contents">
              <span className="text-ink-gray-5">{label}</span>
              <span className="text-ink-gray-7">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
