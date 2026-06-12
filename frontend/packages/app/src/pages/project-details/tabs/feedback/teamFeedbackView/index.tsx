/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import { FEEDBACK_LIST_COLUMNS } from "../constants";
import StarRating from "../starRating";
import { PersonCell } from "./personCell";
import { useTeamFeedbackList } from "../useTeamFeedbackList";

export function TeamFeedbackView() {
  const { feedbackList, isLoading, error, hasMore, loadMore } =
    useTeamFeedbackList();

  return (
    <>
      <div className="w-full overflow-x-auto scrollbar-thin">
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex items-center border-b border-outline-gray-1 px-1 py-1.5">
            {FEEDBACK_LIST_COLUMNS.map((col) => (
              <div
                key={col.key}
                style={{ minWidth: col.width, flex: col.flex }}
                className="shrink-0 px-2"
              >
                <span className="text-sm text-ink-gray-5">{col.label}</span>
              </div>
            ))}
          </div>

          {error ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-ink-gray-5">
                Failed to load feedback.
              </span>
            </div>
          ) : feedbackList.length === 0 && !isLoading ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-ink-gray-5">
                No feedback available.
              </span>
            </div>
          ) : null}

          <InfiniteScroll
            isLoading={isLoading}
            hasMore={hasMore}
            verticalLodMore={loadMore}
            count={3}
          >
            {/* Data rows */}
            {feedbackList.map((row) => (
              <div
                key={row.id}
                className="flex items-center border-b border-outline-gray-1 px-1 py-2 cursor-pointer hover:bg-surface-gray-1"
                onClick={() => {}}
              >
                <div
                  style={{
                    minWidth: FEEDBACK_LIST_COLUMNS[0].width,
                    flex: FEEDBACK_LIST_COLUMNS[0].flex,
                  }}
                  className="shrink-0 px-2"
                >
                  <span className="text-base text-ink-gray-6">{row.from}</span>
                </div>
                <div
                  style={{
                    minWidth: FEEDBACK_LIST_COLUMNS[1].width,
                    flex: FEEDBACK_LIST_COLUMNS[1].flex,
                  }}
                  className="shrink-0 px-2"
                >
                  <span className="text-base text-ink-gray-6">{row.to}</span>
                </div>
                <div
                  style={{
                    minWidth: FEEDBACK_LIST_COLUMNS[2].width,
                    flex: FEEDBACK_LIST_COLUMNS[2].flex,
                  }}
                  className="min-w-0 px-2"
                >
                  <PersonCell person={row.member} />
                </div>
                <div
                  style={{
                    minWidth: FEEDBACK_LIST_COLUMNS[3].width,
                    flex: FEEDBACK_LIST_COLUMNS[3].flex,
                  }}
                  className="min-w-0 px-2"
                >
                  <PersonCell person={row.customer} />
                </div>
                <div
                  style={{
                    minWidth: FEEDBACK_LIST_COLUMNS[4].width,
                    flex: FEEDBACK_LIST_COLUMNS[4].flex,
                  }}
                  className="shrink-0 px-2 flex items-center gap-2"
                >
                  <StarRating
                    rating={row.avgRating}
                    totalStars={5}
                    activeColor="var(--color-amber-600)"
                    inactiveColor="var(--color-gray-300)"
                    size={16}
                  />
                  <span className="text-base text-ink-gray-6 tabular-nums">
                    {row.avgRating.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </InfiniteScroll>
        </div>
      </div>
    </>
  );
}
