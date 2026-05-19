/**
 * External dependencies.
 */
import type { FrappeDoc, FrappeError } from "frappe-react-sdk";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { ProjectDoc } from "./types";

export interface ProjectDetailContextProps {
  projectId: string;
  project: FrappeDoc<ProjectDoc> | undefined;
  isLoading: boolean;
  error: FrappeError | null;
  mutate: () => void;
}

const noop = () => {};

export const ProjectDetailContext = createContext<ProjectDetailContextProps>({
  projectId: "",
  project: undefined,
  isLoading: false,
  error: null,
  mutate: noop,
});

export const useProjectDetail = <T>(
  selector: (state: ProjectDetailContextProps) => T,
) => useContextSelector(ProjectDetailContext, selector);
