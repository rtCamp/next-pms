export const LEAVE_DURATION = ["full-day" , "first-half" , "second-half"] as const;

export interface LeaveTimeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
