/**
 * External dependencies.
 */
import { createContext, useContext } from "react";

/**
 * Internal dependencies.
 */
import type { CommentActions } from "./types";

export const CommentsContext = createContext<CommentActions | null>(null);

export function useCommentsContext() {
  const context = useContext(CommentsContext);

  if (!context) {
    throw new Error(
      "Comments components must be used within CommentsProvider.",
    );
  }

  return context;
}
