import type { ProjectTimelineItem } from "../types";

export interface CreateMilestoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void | Promise<void>;
  /** When provided, the modal operates in edit mode. */
  item?: ProjectTimelineItem;
}
