/**
 * External dependencies.
 */
import { useMemo } from "react";
import { useState } from "react";
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListSelectBanner,
  ListView,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import StarRating from "../starRating";
import { PersonCell } from "./personCell";
import { FEEDBACK_LIST_COLUMNS } from "../constants";
import { useTeamFeedbackList } from "../useTeamFeedbackList";
import { FeedbackDetailDialog } from "./feedbackDetailDialog";

export function TeamFeedbackView() {
  const { feedbackList, isLoading, hasMore, loadMore } = useTeamFeedbackList();
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(
    null,
  );

  const rows = useMemo(
    () =>
      feedbackList.map((item) => ({
        id: item.id,
        from: item.from,
        to: item.to,
        member: <PersonCell person={item.member} />,
        customer: <PersonCell person={item.customer} />,
        avg_rating: (
          <div className="flex items-center gap-2">
            <StarRating
              rating={item.avgRating}
              totalStars={5}
              activeColor="var(--color-amber-600)"
              inactiveColor="var(--color-gray-300)"
              size={16}
            />
            <span className="text-base text-ink-gray-6 tabular-nums">
              {item.avgRating.toFixed(1)}
            </span>
          </div>
        ),
      })),
    [feedbackList],
  );

  return (
    <div>
      <ListView
        rowKey="id"
        columns={FEEDBACK_LIST_COLUMNS.map((col) => ({
          key: col.key,
          label: col.label,
          width: col.width,
        }))}
        options={{
          options: {
            onRowClick: (row) => setSelectedFeedbackId(row.id),
            resizeColumn: false,
            selectable: false,
            showTooltip: true,
          },
        }}
        rows={rows}
      >
        <>
          <ListHeader className="bg-transparent border-b border-outline-gray-1 px-2 py-1.5 mb-0 rounded-none">
            {FEEDBACK_LIST_COLUMNS.map((col) => (
              <ListHeaderItem
                key={col.key}
                item={{
                  key: col.key,
                  label: col.label,
                  width: col.width,
                }}
              />
            ))}
          </ListHeader>

          {rows.length === 0 && !isLoading && (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-ink-gray-5">
                No feedback available.
              </span>
            </div>
          )}

          <ListRows>
            <InfiniteScroll
              isLoading={isLoading}
              hasMore={hasMore}
              verticalLodMore={loadMore}
              count={3}
            >
              {rows.map((row) => (
                <ListRow key={row.id} row={row}>
                  <div className="text-base text-ink-gray-6">{row.from}</div>
                  <div className="text-base text-ink-gray-6">{row.to}</div>
                  <div>{row.member}</div>
                  <div>{row.customer}</div>
                  <div>{row.avg_rating}</div>
                </ListRow>
              ))}
            </InfiniteScroll>
          </ListRows>

          <ListSelectBanner />
        </>
      </ListView>

      {/* Details dialog */}
      <FeedbackDetailDialog
        open={selectedFeedbackId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedFeedbackId(null);
        }}
        feedbackId={selectedFeedbackId}
      />
    </div>
  );
}
