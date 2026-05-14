import { useMemo } from "react";
import { Combobox } from "@rtcamp/frappe-ui-react";
import useApproverOptions from "@/hooks/useApproverOptions";

type ReportsToFilterProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
};

const ReportsToFilter: React.FC<ReportsToFilterProps> = ({
  value,
  onChange,
}) => {
  const approvers = useApproverOptions();

  const options = useMemo(
    () => [...approvers, { label: "All", value: "" }],
    [approvers],
  );

  return (
    <Combobox
      placeholder="Reports to"
      options={options}
      value={value}
      openOnFocus
      onChange={(value) => onChange(value ?? null)}
      className="w-auto"
    />
  );
};

export default ReportsToFilter;
