/**
 * External dependencies.
 */
import { useCallback } from "react";
import type { PropsWithChildren } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  FrappeError,
  useFrappeGetDoc,
  useFrappePostCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import {
  ProjectDetailContext,
  type CreateContractInput,
  type CreateRateInput,
  type ProjectDetailContextProps,
  type RepositoryInput,
} from "./context";
import type { ProjectDoc } from "./types";

interface ProjectDetailProviderProps extends PropsWithChildren {
  projectId: string;
}

export function ProjectDetailProvider({
  projectId,
  children,
}: ProjectDetailProviderProps) {
  const { data, isLoading, error, mutate } = useFrappeGetDoc<ProjectDoc>(
    "Project",
    projectId,
  );

  const { updateDoc } = useFrappeUpdateDoc();
  const { call: shareAdd } = useFrappePostCall("frappe.share.add");
  const { call: shareSetPermission } = useFrappePostCall(
    "frappe.share.set_permission",
  );
  const toast = useToasts();

  const updateRepositories = useCallback(
    async (repositories: RepositoryInput[]) => {
      await updateDoc("Project", projectId, {
        custom_project_repository_connections: repositories,
      });
      mutate();
    },
    [updateDoc, projectId, mutate],
  );

  const addMember = useCallback(
    async (userId: string) => {
      await shareAdd({
        doctype: "Project",
        name: projectId,
        user: userId,
        notify: 1,
        read: 1,
        write: 0,
        submit: 0,
        share: 0,
      });
      mutate();
    },
    [shareAdd, projectId, mutate],
  );

  const removeMember = useCallback(
    async (userId: string) => {
      await shareSetPermission({
        doctype: "Project",
        name: projectId,
        user: userId,
        permission_to: "read",
        value: 0,
        everyone: 0,
      });
      mutate();
    },
    [shareSetPermission, projectId, mutate],
  );

  const updateContacts = useCallback(
    async (contactIds: string[]) => {
      await updateDoc("Project", projectId, {
        custom_customer_contacts: contactIds.map((contact) => ({ contact })),
      });
      mutate();
    },
    [updateDoc, projectId, mutate],
  );

  const deleteRate = useCallback(
    async (name: string) => {
      const current = data?.custom_project_billing_team ?? [];
      try {
        await updateDoc("Project", projectId, {
          custom_project_billing_team: current.filter(
            (row) => row.name !== name,
          ),
        });
        mutate();
        toast.success("Rate deleted");
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [updateDoc, projectId, mutate, data, toast],
  );

  const createRate = useCallback(
    async ({
      isFlatRate,
      employee,
      hourlyRate,
      validFrom,
    }: CreateRateInput) => {
      if (isFlatRate) {
        await updateDoc("Project", projectId, {
          custom_default_hourly_billing_rate: hourlyRate,
          actual_start_date: validFrom,
        });
      } else {
        const current = data?.custom_project_billing_team ?? [];
        await updateDoc("Project", projectId, {
          custom_project_billing_team: [
            ...current,
            {
              employee: employee ?? "",
              hourly_billing_rate: hourlyRate,
              valid_from: validFrom,
            },
          ],
        });
      }
      mutate();
    },
    [updateDoc, projectId, mutate, data],
  );

  const createContract = useCallback(
    async ({
      startDate,
      endDate,
      hoursBought,
      salesOrder,
      salesInvoice,
    }: CreateContractInput) => {
      const current = data?.custom_project_budget_hours ?? [];
      await updateDoc("Project", projectId, {
        custom_project_budget_hours: [
          ...current,
          {
            start_date: startDate,
            end_date: endDate,
            hours_purchased: hoursBought,
            sales_order: salesOrder ?? "",
            sales_invoice: salesInvoice ?? "",
          },
        ],
      });
      mutate();
    },
    [updateDoc, projectId, mutate, data],
  );

  const value: ProjectDetailContextProps = {
    projectId,
    project: data,
    isLoading,
    error: error ?? null,
    mutate,
    updateRepositories,
    addMember,
    removeMember,
    updateContacts,
    deleteRate,
    createRate,
    createContract,
  };

  return (
    <ProjectDetailContext.Provider value={value}>
      {children}
    </ProjectDetailContext.Provider>
  );
}
