import type { CreateRateInput } from "../../../../context";

export interface AddProjectRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateRateInput) => Promise<void>;
}

export type AddProjectRateFormValues = {
  isFlatRate: boolean;
  employee: string;
  hourlyRate: string;
  validFrom: string;
};
