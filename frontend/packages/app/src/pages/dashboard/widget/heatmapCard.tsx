/**
 * External dependencies.
 */
import { useState } from "react";
import { Select } from "@rtcamp/frappe-ui-react";
import { cva } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import {
  ALL_MEMBERS_VALUE,
  HEATMAP_MONTHS,
  HEATMAP_ROWS,
  MEMBER_OPTIONS,
} from "../constants";

export type HeatmapCellState = "full" | "partial" | "none";

export type HeatmapRow = {
  role: string;
  cells: HeatmapCellState[];
};

const STATE_BG: Record<HeatmapCellState, string> = {
  full: "bg-surface-gray-3",
  partial: "bg-surface-red-4",
  none: "bg-heatmap-red",
};

const cellVariants = cva("block h-[7px] w-full rounded-[2px]", {
  variants: { state: STATE_BG },
});

const LEGEND: { label: string; state: HeatmapCellState }[] = [
  { label: "Fully allocated", state: "full" },
  { label: "Partial allocation", state: "partial" },
  { label: "No allocation", state: "none" },
];

export function HeatmapCard() {
  const [member, setMember] = useState<string>(ALL_MEMBERS_VALUE);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-outline-gray-1 bg-surface-cards p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-ink-gray-8">Heatmap</h3>
        <Select
          className="w-fit shrink-0 bg-surface-gray-2 font-bold text-ink-gray-7"
          options={MEMBER_OPTIONS}
          value={member}
          onChange={(value) => setMember(value ?? ALL_MEMBERS_VALUE)}
        />
      </div>
      <table className="w-full table-fixed border-separate border-spacing-x-0.5 border-spacing-y-0">
        <colgroup>
          <col className="w-40" />
          {Array.from({ length: 12 }).map((_, i) => (
            <col key={i} />
          ))}
        </colgroup>
        <thead>
          <tr className="h-[25px]">
            <th />
            {HEATMAP_MONTHS.map((month) => (
              <th
                key={month}
                colSpan={4}
                className="p-0 text-left align-middle text-2xs font-normal text-ink-gray-5"
              >
                {month}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HEATMAP_ROWS.map((row) => (
            <tr key={row.role} className="h-[25px]">
              <th
                scope="row"
                className="truncate p-0 pr-2 text-left align-middle text-2xs font-normal text-ink-gray-5"
                title={row.role}
              >
                {row.role}
              </th>
              {row.cells.map((state: HeatmapCellState, index: number) => (
                <td key={index} className="p-0 align-middle">
                  <span
                    className={cellVariants({ state })}
                    aria-label={`${row.role} week ${index + 1}: ${state}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-center gap-8">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className={`size-2 shrink-0 rounded-full ${STATE_BG[item.state]}`}
            />
            <span className="text-sm text-ink-gray-6">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
