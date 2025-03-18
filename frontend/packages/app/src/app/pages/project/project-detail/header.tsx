/**
 * External dependencies
 */
import { useNavigate } from "react-router-dom";
/**
 * Internal dependencies
 */
import { Filter } from "@/app/components/list-view/header/filter";
import { Header } from "@/app/layout/root";

type ProjectDetailHeaderProps = {
  projectId: string;
};

export const EmployeeDetailHeader = ({ projectId }: ProjectDetailHeaderProps) => {
  const navigate = useNavigate();

  const onProjectChange = (value: string | string[]) => {
    navigate(`/project/${value}`);
  };

  return (
    <>
      <Header>
        <Filter filter={{ type: "search-project", value: projectId, handleChange: onProjectChange }} />
      </Header>
    </>
  );
};
