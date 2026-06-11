import type { CreateRateInput } from "../../../../context";

export type ProjectRateModalMode = "add" | "edit";

export interface ProjectRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateRateInput) => Promise<void>;
  mode?: ProjectRateModalMode;
  initialValues?: Partial<ProjectRateFormValues>;
}

export type ProjectRateFormValues = {
  employee: string;
  hourlyRate: string;
  validFrom: string;
};
