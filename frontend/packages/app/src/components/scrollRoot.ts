/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

export const ScrollRootContext = createContext<HTMLElement | null>(null);

export const useScrollRoot = () =>
  useContextSelector(ScrollRootContext, (root) => root);
