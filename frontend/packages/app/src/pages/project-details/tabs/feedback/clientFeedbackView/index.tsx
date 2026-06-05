/**
 * Internal dependencies.
 */
import { MOCK_BREAKDOWNS, MOCK_MONTHS, MOCK_RESPONSES } from "../mock-data";
import { MonthTimeline } from "./monthTimeline";
import { ResponsesList } from "./responsesList";
import { getMonthName } from "../utils";
import { FeedbackBreakdown } from "./feedbackBreakdown";

export function ClientFeedbackView({
  selectedMonth,
  onSelectMonth,
}: {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}) {
  const entry = MOCK_MONTHS.find((m) => m.key === selectedMonth);
  const hasData = entry?.score != null;
  const breakdown = MOCK_BREAKDOWNS[selectedMonth] ?? [];
  const responses = MOCK_RESPONSES[selectedMonth] ?? [];

  return (
    <>
      <MonthTimeline
        selectedMonth={selectedMonth}
        onSelectMonth={onSelectMonth}
      />

      {!hasData ? (
        <p className="text-base text-ink-gray-5">
          No feedback submitted for this month.
        </p>
      ) : (
        <div className="grid grid-cols-[240px_1fr] gap-6">
          <div>
            <h3 className="text-lg text-ink-gray-7 font-semibold mb-3.5">
              {getMonthName(selectedMonth)} Feedback Breakdown
            </h3>
            <FeedbackBreakdown metrics={breakdown} />
          </div>
          <div>
            <h3 className="text-lg text-ink-gray-7 font-semibold mb-3.5">
              Responses
            </h3>
            <ResponsesList responses={responses} />
          </div>
        </div>
      )}
    </>
  );
}
