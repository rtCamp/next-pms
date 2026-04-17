import {
  ApprovalStatusLabelMap,
  ApprovalStatusType,
} from "@next-pms/design-system/components";
import { Select } from "@rtcamp/frappe-ui-react";

type ApprovalStatusFilterProps = {
  value?: ApprovalStatusType | null;
  onChange: (value?: ApprovalStatusType | null) => void;
  excludeOptions?: ApprovalStatusType[];
};

const ApprovalStatusFilter: React.FC<ApprovalStatusFilterProps> = ({
  value,
  onChange,
  excludeOptions = [],
}) => {
  const options = Object.entries(ApprovalStatusLabelMap)
    .filter(([key]) => !excludeOptions.includes(key as ApprovalStatusType))
    .map(([key, label]) =>
      key === "none" ? { label: "All", value: "" } : { label, value: key },
    );

  return (
    <Select
      placeholder="Approval Status"
      className="w-fit"
      options={options}
      value={value ?? ""}
      onChange={(val) => onChange(val ? (val as ApprovalStatusType) : null)}
    />
  );
};

export default ApprovalStatusFilter;
