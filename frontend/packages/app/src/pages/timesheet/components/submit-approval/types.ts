export type SubmitApprovalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string;
  endDate: string;
  totalHours: number;
};

export type EmployeeRecord = {
  employee_name: string;
  name: string;
};
