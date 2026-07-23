/**
 * External dependencies.
 */
import { useEffect } from "react";
import { useToggleLike } from "@next-pms/hooks";
import { Tooltip, useToasts } from "@rtcamp/frappe-ui-react";
import { Star, SolidStar } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { isLiked, parseFrappeErrorMsg } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { useTaskList } from "../context";

export function LikeCell({ name, likedBy }: { name: string; likedBy: string }) {
  const currentUser = useUser(({ state }) => state.currentUser);
  const refresh = useTaskList((c) => c.actions.refresh);
  const toast = useToasts();
  const { liked, isToggling, error, toggle } = useToggleLike({
    doctype: "Task",
    name,
    liked: isLiked(likedBy, currentUser ?? ""),
    onToggled: refresh,
  });

  useEffect(() => {
    if (error) {
      toast.error(
        parseFrappeErrorMsg(error as Parameters<typeof parseFrappeErrorMsg>[0]),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <Tooltip text={liked ? "Unstar task" : "Star task"}>
      {/* A native <button> can't be used here: ListRow already wraps every
      cell in a <button>, and nested buttons are invalid HTML / trigger a
      React DOM-nesting warning. */}
      <div
        role="button"
        tabIndex={isToggling ? -1 : 0}
        aria-disabled={isToggling}
        onClick={(e) => {
          e.stopPropagation();
          if (!isToggling) toggle();
        }}
        onKeyDown={(e) => {
          if (
            !isToggling &&
            e.target === e.currentTarget &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }
        }}
        aria-label={liked ? "Unstar task" : "Star task"}
        className="inline-flex w-4 h-4 shrink-0 cursor-pointer items-center justify-center focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3 rounded"
      >
        {liked ? (
          <SolidStar className="text-ink-amber-2 size-4" />
        ) : (
          <Star className="text-ink-gray-4 size-4" />
        )}
      </div>
    </Tooltip>
  );
}
