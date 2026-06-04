/**
 * External dependencies.
 */
import { useState } from "react";

/**
 * Internal dependencies.
 */
import { FeedbackBreakdown } from "./feedbackBreakdown";
import { FeedbackToolbar } from "./feedbackToolbar";
import { MOCK_BREAKDOWNS, MOCK_MONTHS, MOCK_RESPONSES } from "./mock-data";
import { MonthTimeline } from "./monthTimeline";
import { ResponsesList } from "./responsesList";
import type { FeedbackType } from "./types";
import { getMonthName } from "./utils";

export function Feedback() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("client");
  const [selectedMonth, setSelectedMonth] = useState("2026-04");

  return (
    <div>
      <FeedbackToolbar
        feedbackType={feedbackType}
        setFeedbackType={setFeedbackType}
      />

      {/* Monthly score timeline – client feedback only */}
      {feedbackType === "client" && (
        <MonthTimeline
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />
      )}

      {/* Feedback breakdown + responses – client feedback only */}
      {feedbackType === "client" &&
        (() => {
          const entry = MOCK_MONTHS.find((m) => m.key === selectedMonth);
          const hasData = entry?.score !== null;
          const breakdown = MOCK_BREAKDOWNS[selectedMonth] ?? [];
          const responses = MOCK_RESPONSES[selectedMonth] ?? [];

          if (!hasData) {
            return (
              <p className="text-base text-ink-gray-5">
                No feedback submitted for this month.
              </p>
            );
          }

          return (
            <div className="grid grid-cols-[240px_1fr] gap-6">
              {/* Left: Breakdown */}
              <div>
                <h3 className="text-lg text-ink-gray-7 font-semibold mb-3.5">
                  {getMonthName(selectedMonth)} Feedback Breakdown
                </h3>
                <FeedbackBreakdown metrics={breakdown} />
              </div>

              {/* Right: Responses */}
              <div>
                <h3 className="text-lg text-ink-gray-7 font-semibold mb-3.5">
                  Responses
                </h3>
                <ResponsesList responses={responses} />
              </div>
            </div>
          );
        })()}
    </div>
  );
}
