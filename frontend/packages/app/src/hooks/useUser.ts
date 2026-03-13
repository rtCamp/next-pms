/**
 * External dependencies.
 */
import { useSelector } from "react-redux";

/**
 * Internal dependencies.
 */
import type { RootState } from "@/store";

export function useUser() {
  return useSelector((state: RootState) => state.user);
}
