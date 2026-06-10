import type { CreateContractInput } from "../../../../context";

export interface AddContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateContractInput) => Promise<void>;
  projectId: string;
}

export type AddContractFormValues = {
  startDate: string;
  endDate: string;
  hoursBought: string;
  salesOrder: string;
  salesInvoice: string;
};
