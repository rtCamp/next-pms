/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import { useClientFeedbackBreakdown } from "../useClientFeedbackBreakdown";
import { FeedbackBreakdown } from "./feedbackBreakdown";
import { MonthTimeline } from "./monthTimeline";
import { ResponsesList } from "./responsesList";
import { useFeedbackContext } from "../context";

export function ClientFeedbackView() {
  const {
    selectedClientFeedbackId,
    handleClientFeedbackIdChange,
    selectedClientMonth,
    handleSelectedMonthChange,
  } = useFeedbackContext((c) => c);
  const {
    breakdown,
    responses,
    isLoading: isBreakdownLoading,
  } = useClientFeedbackBreakdown(selectedClientFeedbackId);

  return (
    <>
      <MonthTimeline
        setSelectedFeedbackId={handleClientFeedbackIdChange}
        selectedMonth={selectedClientMonth}
        setSelectedMonth={handleSelectedMonthChange}
      />

      {!selectedClientFeedbackId || !selectedClientMonth ? (
        <p className="text-base text-ink-gray-5 text-center p-4">
          No feedback submitted for this month.
        </p>
      ) : isBreakdownLoading ? (
        <Spinner className="pt-16" />
      ) : (
        <div className="grid grid-cols-[240px_1fr] gap-6">
          <div>
            <h3 className="text-lg text-ink-gray-8 font-medium mb-3.5">
              {format(
                new Date(selectedClientMonth.year, selectedClientMonth.month),
                "MMMM",
              )}{" "}
              Feedback Breakdown
            </h3>
            <FeedbackBreakdown metrics={breakdown} />
          </div>
          <div>
            <h3 className="text-lg text-ink-gray-8 font-medium mb-3.5">
              Responses
            </h3>
            <ResponsesList responses={responses} />
          </div>
        </div>
      )}
    </>
  );
}
