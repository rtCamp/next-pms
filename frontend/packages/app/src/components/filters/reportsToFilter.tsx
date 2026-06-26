import { useMemo } from "react";
import { Combobox } from "@rtcamp/frappe-ui-react";
import useApproverOptions from "@/hooks/useApproverOptions";
import { REPORTS_TO_ALL_VALUE } from "@/pages/timesheet/hooks/useTimesheetFilters";

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
    () => [{ label: "All", value: REPORTS_TO_ALL_VALUE }, ...approvers],
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
