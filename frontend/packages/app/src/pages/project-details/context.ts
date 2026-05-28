/**
 * External dependencies.
 */
import type { FrappeDoc, FrappeError } from "frappe-react-sdk";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { ProjectDoc, ProjectRepositoryConnection } from "./types";

export type RepositoryInput = Pick<
  ProjectRepositoryConnection,
  "github_repository"
> &
  Partial<Pick<ProjectRepositoryConnection, "name">>;

export interface ProjectDetailContextProps {
  projectId: string;
  project: FrappeDoc<ProjectDoc> | undefined;
  isLoading: boolean;
  error: FrappeError | null;
  mutate: () => void;
  updateRepositories: (repositories: RepositoryInput[]) => Promise<void>;
}

const noop = () => {};
const asyncNoop = async () => {};

export const ProjectDetailContext = createContext<ProjectDetailContextProps>({
  projectId: "",
  project: undefined,
  isLoading: false,
  error: null,
  mutate: noop,
  updateRepositories: asyncNoop,
});

export const useProjectDetail = <T>(
  selector: (state: ProjectDetailContextProps) => T,
) => useContextSelector(ProjectDetailContext, selector);
