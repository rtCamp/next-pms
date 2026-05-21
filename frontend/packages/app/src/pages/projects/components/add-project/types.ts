import type { AddProjectFormValues } from "./schema";

export type AddProjectSuccessCallback = (
  doc: { name: string } & Record<string, unknown>,
) => void;

export interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: Partial<AddProjectFormValues>;
  onSuccess?: AddProjectSuccessCallback;
}
