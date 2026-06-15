/**
 * External dependencies.
 */
import { useEffect, useRef } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Spinner } from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  addMonths,
  format,
  eachMonthOfInterval,
  getMonth,
  getYear,
} from "date-fns";

/**
 * Internal dependencies.
 */
import { useFeedbackContext } from "../context";
import type { MonthEntry, MonthYear } from "../types";
import { useClientFeedbackTimeline } from "../useClientFeedbackTimeline";

function getScoreColorClass(
  score: MonthEntry["score"],
  isSelected: boolean,
): string {
  if (isSelected) return "text-ink-white";
  if (score === null) return "text-ink-gray-4";
  if (score >= 80) return "text-ink-gray-6";
  if (score >= 60) return "text-ink-amber-4";
  return "text-ink-red-4";
}

const STEP_MONTHS = 3;

interface MonthTimelineProps {
  selectedMonth: MonthYear;
  setSelectedMonth: (month: MonthYear) => void;
  setSelectedFeedbackId: (id: string | null) => void;
}

export function MonthTimeline({
  selectedMonth,
  setSelectedMonth,
  setSelectedFeedbackId,
}: MonthTimelineProps) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const beginTimelineRef = useRef<HTMLDivElement | null>(null);
  const endTimelineRef = useRef<HTMLDivElement | null>(null);
  const activeMonthRef = useRef<HTMLButtonElement | null>(null);
  const startDate = useFeedbackContext((c) => c.clientTimelineStartDate);
  const setStartDate = useFeedbackContext((c) => c.setClientTimelineStartDate);
  const endDate = useFeedbackContext((c) => c.clientTimelineEndDate);
  const setEndDate = useFeedbackContext((c) => c.setClientTimelineEndDate);
  const isInitialLoad = useRef<boolean>(true);
  const toast = useToasts();
  const {
    months: monthwiseData,
    isLoading,
    error,
  } = useClientFeedbackTimeline({ startDate, endDate });

  const months = eachMonthOfInterval({ start: startDate, end: endDate }).map(
    (date) => {
      const month = getMonth(date);
      const year = getYear(date);
      const monthData = monthwiseData.find(
        (m) => m.month === month && m.year === year,
      );
      return {
        date,
        month,
        year,
        score: monthData?.score ?? null,
        feedback_id: monthData?.feedback_id ?? null,
      };
    },
  );

  useEffect(() => {
    if (error) {
      toast.error("Failed to load feedback timeline");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast.error modifies the hooks state so if we add it to deps it causes infinite loop, error is the actual dep we want to listen to.
  }, [error]);

  useEffect(() => {
    if (!isInitialLoad.current || monthwiseData.length === 0) return;

    // Pre-select feedback for the month if available, on initial load.
    const monthData = monthwiseData.find(
      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year,
    );

    setSelectedFeedbackId(monthData?.feedback_id ?? null);
    isInitialLoad.current = false;
  }, [monthwiseData, selectedMonth, setSelectedFeedbackId]);

  useEffect(() => {
    if (!timelineRef.current || !activeMonthRef.current) return;

    // Hold stable references to these elements for the lifecycle of this effect, required for proper cleanup.
    const timelineEl = timelineRef.current;
    const beginTimelineEl = beginTimelineRef.current;
    const endTimelineEl = endTimelineRef.current;
    const activeMonthEl = activeMonthRef.current;

    // We want the element centered in the visible viewport
    timelineEl.scrollTo({
      left:
        activeMonthEl.offsetLeft -
        timelineEl.clientWidth / 2 +
        activeMonthEl.offsetWidth / 2,
      behavior: "instant",
    });

    // Sliding backward (begin sentinel fires)
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || !timelineEl) return;

        const anchor =
          beginTimelineEl?.nextElementSibling as HTMLElement | null;
        if (!anchor) return;

        // Visual position of anchor on screen before DOM changes
        const anchorScreenOffset = anchor.offsetLeft - timelineEl.scrollLeft;

        // Slide the window
        setStartDate((prev) => addMonths(prev, -STEP_MONTHS));
        setEndDate((prev) => addMonths(prev, -STEP_MONTHS));

        requestAnimationFrame(() => {
          if (!anchor || !timelineEl) return;
          timelineEl.scrollLeft = anchor.offsetLeft - anchorScreenOffset;
        });
      },
      { root: timelineEl, threshold: 0.5 },
    );

    // Sliding forward (end sentinel fires)
    const endObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || !timelineEl) return;

        const anchor =
          endTimelineEl?.previousElementSibling as HTMLElement | null;
        if (!anchor) return;

        const anchorScreenOffset = anchor.offsetLeft - timelineEl.scrollLeft;

        setStartDate((prev) => addMonths(prev, STEP_MONTHS));
        setEndDate((prev) => addMonths(prev, STEP_MONTHS));

        requestAnimationFrame(() => {
          if (!anchor || !timelineEl) return;
          timelineEl.scrollLeft = anchor.offsetLeft - anchorScreenOffset;
        });
      },
      { root: timelineEl, threshold: 0.5 },
    );

    if (beginTimelineEl) {
      observer.observe(beginTimelineEl);
    }

    if (endTimelineEl) {
      endObserver.observe(endTimelineEl);
    }

    return () => {
      if (beginTimelineEl) {
        observer.unobserve(beginTimelineEl);
      }
      if (endTimelineEl) {
        endObserver.unobserve(endTimelineEl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- We only want to run this effect once on mount to set up the observers, the dependencies are all stable references or refs that we read inside the effect but don't want to trigger it.
  }, []);

  const handleMonthClick = (entry: MonthEntry) => {
    setSelectedMonth({ month: entry.month, year: entry.year });
    setSelectedFeedbackId(entry.feedback_id);
  };

  return (
    <div className="relative">
      {/* Edge blur */}
      <div className="absolute top-0 left-0 z-10 w-12 h-full from-surface-white to-transparent pointer-events-none bg-linear-to-r" />

      <div className="overflow-x-auto no-scrollbar pb-4 mb-4" ref={timelineRef}>
        <div className="flex gap-2 min-w-max">
          {/* Starting Sentinel */}
          <span ref={beginTimelineRef} className="w-2" />

          {months.map((entry) => {
            const isSelected =
              entry.month === selectedMonth.month &&
              entry.year === selectedMonth.year;
            const scoreClass = getScoreColorClass(entry.score, isSelected);

            return (
              <button
                key={entry.date.toISOString()}
                onClick={() => handleMonthClick(entry)}
                type="button"
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg shrink-0 w-[42px] py-2 gap-0.5 cursor-pointer transition-colors",
                  isSelected ? "bg-surface-gray-7" : "bg-surface-gray-1",
                )}
                ref={isSelected ? activeMonthRef : null}
              >
                <span
                  className={cn(
                    "text-2xs",
                    isSelected ? "text-ink-gray-3" : "text-ink-gray-4",
                  )}
                >
                  {format(new Date(entry.year, entry.month), "MMM")}
                </span>
                <span className={cn("text-base font-medium", scoreClass)}>
                  {isLoading ? (
                    <Spinner className="w-4 h-4" />
                  ) : entry.score !== null ? (
                    entry.score
                  ) : (
                    "-"
                  )}
                </span>
                {entry.month === 0 && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-surface-white rounded px-1 h-3 flex items-center justify-center">
                    <span className="text-[9px] text-ink-gray-5 whitespace-nowrap leading-none">
                      {entry.year}
                    </span>
                  </div>
                )}
              </button>
            );
          })}

          {/* Ending Sentinel */}
          <span ref={endTimelineRef} className="w-2" />
        </div>
      </div>

      {/* Edge blur */}
      <div className="absolute top-0 right-0 z-10 w-12 h-full from-surface-white to-transparent pointer-events-none bg-linear-to-l" />
    </div>
  );
}
