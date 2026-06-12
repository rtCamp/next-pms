/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  type FrappeError,
  useFrappeGetCall,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { currencyFormat, parseFrappeErrorMsg } from "@/lib/utils";
import {
  DEFAULT_TRACKING,
  TrackingContext,
  type TrackingContextProps,
} from "./context";

import type {
  ContractRow,
  RateRow,
  CreateContractInput,
  CreateRateInput,
  EditContractInput,
  EditRateInput,
  Response,
  Tracking,
} from "./types";

import { useProjectDetail } from "../../context";

export function TrackingProvider({ children }: PropsWithChildren) {
  const projectId = useProjectDetail((s) => s.projectId);
  const project = useProjectDetail((s) => s.project);
  const projectMutate = useProjectDetail((s) => s.mutate);
  const { updateDoc } = useFrappeUpdateDoc();
  const toast = useToasts();

  const [addRateModalOpen, setAddRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<RateRow | null>(null);
  const [addContractModalOpen, setAddContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractRow | null>(
    null,
  );

  const { data, mutate } = useFrappeGetCall<Response>(
    "next_pms.next_projects.api.project.get_project_tracking",
    {
      project: projectId,
    },
  );

  const tracking = useMemo<Tracking>(
    () => data?.message ?? DEFAULT_TRACKING,
    [data],
  );

  const deleteRate = useCallback(
    async (name: string) => {
      const current = project?.custom_project_billing_team ?? [];
      try {
        await updateDoc("Project", projectId, {
          custom_project_billing_team: current.filter(
            (row) => row.name !== name,
          ),
        });
        projectMutate();
        await mutate();
        toast.success("Rate deleted");
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [updateDoc, projectId, projectMutate, mutate, project, toast],
  );

  const editRate = useCallback(
    async ({ name, employee, hourlyRate, validFrom }: EditRateInput) => {
      const current = project?.custom_project_billing_team ?? [];
      try {
        await updateDoc("Project", projectId, {
          custom_project_billing_team: current.map((row) =>
            row.name === name
              ? {
                  ...row,
                  employee,
                  hourly_billing_rate: hourlyRate,
                  valid_from: validFrom,
                }
              : row,
          ),
        });
        projectMutate();
        await mutate();
        toast.success("Rate updated");
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [updateDoc, projectId, projectMutate, mutate, project, toast],
  );

  const createRate = useCallback(
    async ({ employee, hourlyRate, validFrom }: CreateRateInput) => {
      const current = project?.custom_project_billing_team ?? [];
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
      projectMutate();
      await mutate();
    },
    [updateDoc, projectId, projectMutate, mutate, project],
  );

  const createContract = useCallback(
    async ({
      startDate,
      endDate,
      hoursBought,
      salesOrder,
      salesInvoice,
    }: CreateContractInput) => {
      const current = project?.custom_project_budget_hours ?? [];
      try {
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
        projectMutate();
        await mutate();
        toast.success("Contract added");
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [updateDoc, projectId, projectMutate, mutate, project, toast],
  );

  const editContract = useCallback(
    async ({
      name,
      startDate,
      endDate,
      hoursBought,
      salesOrder,
      salesInvoice,
    }: EditContractInput) => {
      const current = project?.custom_project_budget_hours ?? [];
      try {
        await updateDoc("Project", projectId, {
          custom_project_budget_hours: current.map((row) =>
            row.name === name
              ? {
                  ...row,
                  start_date: startDate,
                  end_date: endDate,
                  hours_purchased: hoursBought,
                  sales_order: salesOrder ?? "",
                  sales_invoice: salesInvoice ?? "",
                }
              : row,
          ),
        });
        projectMutate();
        await mutate();
        toast.success("Contract updated");
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [updateDoc, projectId, projectMutate, mutate, project, toast],
  );

  const deleteContract = useCallback(
    async (name: string) => {
      const current = project?.custom_project_budget_hours ?? [];
      try {
        await updateDoc("Project", projectId, {
          custom_project_budget_hours: current.filter(
            (row) => row.name !== name,
          ),
        });
        projectMutate();
        await mutate();
        toast.success("Contract deleted");
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [updateDoc, projectId, projectMutate, mutate, project, toast],
  );

  const value = useMemo<TrackingContextProps>(() => {
    const formatter = currencyFormat(tracking.currency);

    const contracts: ContractRow[] | null = tracking.contracts
      ? tracking.contracts.map((c, i) => ({
          id: c.name || c.sales_order || c.sales_invoice || `${i}`,
          name: c.name,
          startDate: c.start_date,
          endDate: c.end_date,
          hoursBought: `${c.hours_purchased}`,
          hoursBoughtRaw: c.hours_purchased,
          hoursUsed: `${c.consumed_hours}`,
          hoursLeft: `${c.remaining_hours}`,
          salesOrder: c.sales_order,
          salesInvoice: c.sales_invoice,
        }))
      : null;

    const [flatRateEntry, ...rateEntries] = tracking.project_rates ?? [];

    const rates: RateRow[] | null = tracking.project_rates
      ? rateEntries.map((rate) => ({
          id: rate.employee ?? "",
          name: rate.name ?? "",
          employee: rate.employee ?? "",
          employeeName: rate.employee_name ?? rate.employee ?? "",
          rateLabel: "Hourly rate",
          amount: `${formatter.format(rate.hourly_billing_rate ?? 0)}/h`,
          hourlyRate: rate.hourly_billing_rate ?? 0,
          date: rate.valid_from ?? "",
        }))
      : null;

    const flatRate = flatRateEntry
      ? {
          amount: `${formatter.format(flatRateEntry.flat_rate_hourly ?? 0)}/h`,
          date: flatRateEntry.flat_rate_valid_from ?? "",
        }
      : undefined;

    return {
      tracking,
      contracts,
      rates,
      flatRate,
      deleteRate,
      createRate,
      editRate,
      editingRate,
      setEditingRate,
      addRateModalOpen,
      setAddRateModalOpen,
      createContract,
      editContract,
      deleteContract,
      editingContract,
      setEditingContract,
      addContractModalOpen,
      setAddContractModalOpen,
    };
  }, [
    tracking,
    deleteRate,
    createRate,
    editRate,
    editingRate,
    createContract,
    editContract,
    deleteContract,
    editingContract,
    addRateModalOpen,
    addContractModalOpen,
  ]);

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}
