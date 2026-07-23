import {
  ApprovalStatusDisplayLabelMap,
  ApprovalStatusType,
} from "@next-pms/design-system/components";
import { MultiSelect } from "@rtcamp/frappe-ui-react";

type ApprovalStatusFilterProps = {
  value?: ApprovalStatusType[];
  onChange: (value: ApprovalStatusType[]) => void;
  excludeOptions?: ApprovalStatusType[];
};

const ApprovalStatusFilter: React.FC<ApprovalStatusFilterProps> = ({
  value = [],
  onChange,
  excludeOptions = [],
}) => {
  const options = Object.entries(ApprovalStatusDisplayLabelMap)
    .filter(
      ([key]) =>
        key !== "none" && !excludeOptions.includes(key as ApprovalStatusType),
    )
    .map(([key, label]) => ({ label, value: key }));

  return (
    <MultiSelect
      placeholder="Approval status"
      triggerClassName="w-fit max-w-42 text-ink-gray-7"
      popupClassName="w-max min-w-(--anchor-width)"
      hideSearch
      options={options}
      value={value}
      onChange={(values) => onChange(values as ApprovalStatusType[])}
    />
  );
};

export default ApprovalStatusFilter;
