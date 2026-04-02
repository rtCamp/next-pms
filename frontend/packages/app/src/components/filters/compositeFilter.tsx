import { Filter, FilterCondition } from "@rtcamp/frappe-ui-react";
import { FilterField } from "@rtcamp/frappe-ui-react";

const filters: FilterField[] = [
  {
    fieldCategory: "Timesheet Detail",
    name: "project_name",
    label: "Project",
    type: "string",
  },
  {
    fieldCategory: "Task",
    name: "subject",
    label: "Task",
    type: "string",
  },
  {
    name: "date",
    label: "Date",
    type: "daterange",
  },
];

type CompositeFilterProps = {
  filter: FilterCondition[];
  handleFilterChange: (filters: FilterCondition[]) => void;
};

const CompositeFilter: React.FC<CompositeFilterProps> = ({
  filter,
  handleFilterChange,
}) => {
  return (
    <Filter
      align="end"
      fields={filters}
      value={filter}
      onChange={(newFilters) => {
        handleFilterChange(newFilters);
      }}
    />
  );
};

export default CompositeFilter;
