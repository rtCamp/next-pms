import type { CreateContractInput } from "../../../../context";

export type ContractModalMode = "add" | "edit";

export interface ContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateContractInput) => Promise<void>;
  mode?: ContractModalMode;
  initialValues?: Partial<ContractFormValues>;
}

export type ContractFormValues = {
  startDate: string;
  endDate: string;
  hoursBought: string;
  salesOrder: string;
  salesInvoice: string;
};
