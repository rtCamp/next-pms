/**
 * External dependencies.
 */
import { createContext, useContext } from "react";
import { CommentInputContextValue } from "./types";

export const CommentInputContext =
  createContext<CommentInputContextValue | null>(null);

export function useCommentInputContext() {
  const ctx = useContext(CommentInputContext);
  if (!ctx)
    throw new Error(
      "CommentInput sub-components must be used inside CommentInput.",
    );
  return ctx;
}
