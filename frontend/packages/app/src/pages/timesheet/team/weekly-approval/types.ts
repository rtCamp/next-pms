export type WeeklyApprovalProps = {
  employee: string;
  startDate: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
