import { TextInput } from "@rtcamp/frappe-ui-react";

type SearchTasksProps = {
  value: string;
  onChange: (value: string) => void;
};

const SearchTasks: React.FC<SearchTasksProps> = ({ value, onChange }) => {
  return (
    <TextInput
      placeholder="Search Tasks"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onChange(e.target.value)
      }
    />
  );
};

export default SearchTasks;
