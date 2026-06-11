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

export type CreateRateInput = {
  employee?: string;
  hourlyRate: number;
  validFrom: string;
};

export type EditRateInput = {
  name: string;
  employee: string;
  hourlyRate: number;
  validFrom: string;
};

export type CreateContractInput = {
  startDate: string;
  endDate: string;
  hoursBought: number;
  salesOrder?: string;
  salesInvoice?: string;
};

export type EditContractInput = {
  name: string;
  startDate: string;
  endDate: string;
  hoursBought: number;
  salesOrder?: string;
  salesInvoice?: string;
};

export interface ProjectDetailContextProps {
  projectId: string;
  project: FrappeDoc<ProjectDoc> | undefined;
  isLoading: boolean;
  error: FrappeError | null;
  mutate: () => void;
  updateRepositories: (repositories: RepositoryInput[]) => Promise<void>;
  addMember: (userId: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateContacts: (contactIds: string[]) => Promise<void>;
  deleteRate: (name: string) => Promise<void>;
  createRate: (input: CreateRateInput) => Promise<void>;
  editRate: (input: EditRateInput) => Promise<void>;
  createContract: (input: CreateContractInput) => Promise<void>;
  editContract: (input: EditContractInput) => Promise<void>;
  deleteContract: (name: string) => Promise<void>;
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
  addMember: asyncNoop,
  removeMember: asyncNoop,
  updateContacts: asyncNoop,
  deleteRate: asyncNoop,
  createRate: asyncNoop,
  editRate: asyncNoop,
  createContract: asyncNoop,
  editContract: asyncNoop,
  deleteContract: asyncNoop,
});

export const useProjectDetail = <T>(
  selector: (state: ProjectDetailContextProps) => T,
) => useContextSelector(ProjectDetailContext, selector);
