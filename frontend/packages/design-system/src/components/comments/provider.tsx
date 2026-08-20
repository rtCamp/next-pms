/**
 * External dependencies.
 */
import type { PropsWithChildren } from "react";

/**
 * Internal dependencies.
 */
import { CommentsContext } from "./context";
import type { CommentActions } from "./types";

type CommentsProviderProps = PropsWithChildren<CommentActions>;

export function CommentsProvider({
  children,
  ...value
}: CommentsProviderProps) {
  return (
    <CommentsContext.Provider value={value}>
      {children}
    </CommentsContext.Provider>
  );
}
