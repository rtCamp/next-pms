import { Select } from "@rtcamp/frappe-ui-react";
import { ApprovalStatusType } from "@/types/timesheet";

type ApprovalStatusFilterProps = {
  value?: ApprovalStatusType | null;
  onChange: (value?: ApprovalStatusType | null) => void;
};

const ApprovalStatusFilter: React.FC<ApprovalStatusFilterProps> = ({
  value,
  onChange,
}) => {
  const options = [
    {
      label: "Not Submitted",
      value: "not-submitted",
    },
    {
      label: "Approval Pending",
      value: "approval-pending",
    },
    {
      label: "Approved",
      value: "approved",
    },
    {
      label: "Rejected",
      value: "rejected",
    },
    {
      label: "All",
      value: "",
    },
  ];

  return (
    <Select
      placeholder="Approval Status"
      className="w-fit"
      options={options}
      value={value ?? ""}
      onChange={(value) => onChange(value as ApprovalStatusType)}
    />
  );
};

export default ApprovalStatusFilter;
