/**
 * External dependencies.
 */
import { Comments, Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { format } from "date-fns";
import { useUser } from "@/providers/user";
import StarRating from "../starRating";
import { useFeedbackComments } from "../useFeedbackComments";
import { useTeamFeedbackBreakdown } from "../useTeamFeedbackBreakdown";
import { MetaRow } from "./metaRow";

export function FeedbackDetailBody({ feedbackId }: { feedbackId: string }) {
  const { detail, breakdown, isLoading } = useTeamFeedbackBreakdown(feedbackId);
  const {
    comments,
    isLoading: isCommentsLoading,
    isUpdating,
    addComment,
    replyToComment,
    editComment,
    deleteComment,
  } = useFeedbackComments(feedbackId);
  const { userId, currentUser, userName, userImage } = useUser(({ state }) => ({
    userId: state.userId,
    currentUser: state.currentUser,
    userName: state.userName,
    userImage: state.image,
  }));

  return isLoading ? (
    <div className="flex h-60 items-center justify-center">
      <Spinner isFull={true} />
    </div>
  ) : (
    <div className="-mx-5 -mb-6 sm:-mx-6 flex border-t border-outline-gray-1 max-h-[72vh] -mt-4 relative">
      {/* Left: main content */}
      <div className="flex-1 min-w-0 max-h-[72vh] overflow-y-auto scrollbar-thin">
        <div className="flex flex-col gap-6 p-6">
          {/* Rating category cards */}
          <div className="flex gap-2 w-full overflow-x-auto scrollbar-thin">
            {breakdown.map((cat) => (
              <div
                key={cat.label}
                className="flex basis-36 shrink-0 flex-col gap-3 rounded-lg border border-outline-gray-1 bg-surface-modal p-3"
              >
                <span className="text-sm text-ink-gray-5 leading-tight">
                  {cat.label}
                </span>
                <div className="mt-auto">
                  <StarRating
                    rating={cat.rating}
                    totalStars={5}
                    size={18}
                    activeColor="var(--color-amber-600)"
                    inactiveColor="var(--color-gray-300)"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Areas of improvement */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold text-ink-gray-8">
              Areas of improvement
            </h3>
            <p className="text-base text-ink-gray-8 leading-relaxed">
              {detail.areasOfImprovement || "No specific areas mentioned."}
            </p>
          </div>

          {/* Comments */}
          <Comments
            isUpdating={isUpdating}
            authorId={userId}
            canManageAllComments={currentUser === "Administrator"}
            onReply={replyToComment}
            onEdit={editComment}
            onDelete={deleteComment}
          >
            <Comments.Title>
              <h3 className="text-xl font-semibold text-ink-gray-8">
                Comments
              </h3>
            </Comments.Title>
            <Comments.List comments={comments} isLoading={isCommentsLoading} />
            <Comments.Input
              placeholder="Add a comment"
              submitLabel="Post"
              onSubmit={addComment}
              triggerClassName="sticky bottom-6 left-0"
              avatarName={userName}
              avatarImage={userImage}
            />
          </Comments>
        </div>
      </div>

      {/* Right: metadata sidebar */}
      <div className="w-78 shrink-0 border-l border-outline-gray-1 px-5 py-5 flex flex-col gap-3.5">
        <MetaRow label="From" value={format(detail.periodFrom, "MMM dd")} />
        <MetaRow label="To" value={format(detail.periodTo, "MMM dd")} />
        <MetaRow label="Member" person={detail.employee} />
        <MetaRow label="Customer" person={detail.customer} />
        <div className="flex items-center gap-4 py-1">
          <span className="w-28 shrink-0 text-base text-ink-gray-6">
            Average rating
          </span>
          <div className="flex flex-1 items-center gap-1.5 px-2">
            <StarRating
              rating={detail.average ?? 0}
              totalStars={5}
              size={16}
              activeColor="var(--color-amber-600)"
              inactiveColor="var(--color-gray-300)"
            />
            <span className="text-base text-ink-gray-6 tabular-nums">
              {detail.average?.toFixed(1) ?? "0.0"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
