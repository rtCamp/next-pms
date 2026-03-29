import { ApprovalStatusType } from "@next-pms/design-system/components";
import { Select } from "@rtcamp/frappe-ui-react";

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
      label: "All",
      value: "",
    },
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
