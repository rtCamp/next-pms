export interface CreateMilestoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void | Promise<void>;
}
