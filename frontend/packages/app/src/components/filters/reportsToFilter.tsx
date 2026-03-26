import { Combobox } from "@rtcamp/frappe-ui-react";
import useApprovers from "@/hooks/useApprovers";

type ReportsToFilterProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
};

const ReportsToFilter: React.FC<ReportsToFilterProps> = ({
  value,
  onChange,
}) => {
  const approvers = useApprovers();

  return (
    <Combobox
      placeholder="Reports to"
      options={approvers}
      value={value}
      onChange={(value) => onChange(value ?? null)}
      className="w-auto"
    />
  );
};

export default ReportsToFilter;
