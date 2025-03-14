export interface LeaveTimeProps {
  employee: string;
  employeeName: string;
  open: boolean;
  onOpenChange: () => void;
  onSuccess?: () => void;
}

export type LeaveInfoData = {
  total_leaves: number;
  expired_leaves: number;
  leaves_taken: number;
  leaves_pending_approval: number;
  remaining_leaves: number;
};

export type LeaveInfoProps = {
  leaveInfo: { [key: string]: LeaveInfoData };
};
