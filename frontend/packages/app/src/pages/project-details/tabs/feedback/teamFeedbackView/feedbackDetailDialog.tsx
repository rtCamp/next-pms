/**
 * External dependencies.
 */
import { Avatar, Dialog } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import StarRating from "../starRating";
import type { TeamFeedbackDetail, TeamFeedbackRow } from "../types";

interface FeedbackDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: TeamFeedbackRow | null;
  detail: TeamFeedbackDetail | null;
}

export function FeedbackDetailDialog({
  open,
  onOpenChange,
  row,
  detail,
}: FeedbackDetailDialogProps) {
  if (!row || !detail) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      options={{
        title: () => (
          <div className="text-xl font-semibold text-ink-gray-8">
            Detailed feedback
          </div>
        ),
        size: "4xl",
      }}
    >
      {/* Two-column body */}
      <div className="-mx-5 -mb-6 sm:-mx-6 flex border-t border-outline-gray-1 max-h-[72vh] -mt-4">
        {/* Left: main content */}
        <div className="max-h-[72vh] overflow-y-auto scrollbar-thin relative">
          <div className="flex flex-1 flex-col gap-6 p-6">
            {/* Rating category cards */}
            <div className="flex gap-2 w-full">
              {detail.ratingCategories.map((cat) => (
                <div
                  key={cat.label}
                  className="flex flex-1 flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-modal p-3"
                >
                  <span className="text-sm text-ink-gray-5 leading-tight">
                    {cat.label}
                  </span>
                  <StarRating
                    rating={cat.rating}
                    totalStars={5}
                    size={18}
                    activeColor="var(--color-amber-600)"
                    inactiveColor="var(--color-gray-300)"
                  />
                </div>
              ))}
            </div>

            {/* Areas of improvement */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold text-ink-gray-8">
                Areas of improvement
              </h3>
              <p className="text-base text-ink-gray-8 leading-relaxed">
                {detail.areasOfImprovement}
              </p>
            </div>

            {/* Comments */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-semibold text-ink-gray-8">
                Comments
              </h3>
              {detail.comments.length === 0 ? (
                <p className="text-base text-ink-gray-5">No comments yet.</p>
              ) : (
                detail.comments.map((comment, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 py-1">
                      <Avatar
                        size="xs"
                        label={comment.author.name}
                        image={comment.author.image}
                      />
                      <span className="flex-1 text-base font-medium text-ink-gray-8">
                        {comment.author.name}
                      </span>
                      <span className="text-sm text-ink-gray-5">
                        {comment.timestamp}
                      </span>
                    </div>
                    <div className="ml-6 rounded-lg bg-surface-gray-1 px-3 py-2.5">
                      <p className="text-base text-ink-gray-8 leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Comment input */}
          <div className="flex items-center gap-3 mt-auto sticky bottom-0 p-6 bg-linear-to-t from-surface-white">
            <Avatar size="xl" label="You" />
            <input
              type="text"
              className="flex-1 rounded-lg border border-outline-gray-2 p-2.5 w-full bg-surface-white text-base text-ink-gray-8 placeholder:text-ink-gray-4 outline-none"
              placeholder="Input text"
            />
          </div>
        </div>

        {/* Right: metadata sidebar */}
        <div className="w-78 shrink-0 border-l border-outline-gray-1 px-5 py-5 flex flex-col gap-3.5">
          <MetaRow label="From" value={row.from} />
          <MetaRow label="To" value={row.to} />
          <MetaRow label="Member" person={row.member} />
          <MetaRow label="Customer" person={row.customer} />
          <div className="flex items-center gap-4 py-1">
            <span className="w-28 shrink-0 text-base text-ink-gray-6">
              Average rating
            </span>
            <div className="flex flex-1 items-center gap-1.5 px-2">
              <StarRating
                rating={row.avgRating}
                totalStars={5}
                size={16}
                activeColor="var(--color-amber-600)"
                inactiveColor="var(--color-gray-300)"
              />
              <span className="text-base text-ink-gray-6 tabular-nums">
                {row.avgRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

interface MetaRowTextProps {
  label: string;
  value: string;
  person?: never;
}

interface MetaRowPersonProps {
  label: string;
  person: { name: string; image?: string };
  value?: never;
}

type MetaRowProps = MetaRowTextProps | MetaRowPersonProps;

function MetaRow({ label, value, person }: MetaRowProps) {
  return (
    <div className="flex items-center gap-4 py-1">
      <span className="w-28 shrink-0 text-base text-ink-gray-6">{label}</span>
      <div className="flex flex-1 items-center gap-2 px-2">
        {person ? (
          <>
            <Avatar size="xs" label={person.name} image={person.image} />
            <span className="text-base text-ink-gray-6">{person.name}</span>
          </>
        ) : (
          <span className="text-base text-ink-gray-6">{value}</span>
        )}
      </div>
    </div>
  );
}
