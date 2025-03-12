/**
 * External dependencies
 */
import { useNavigate } from "react-router-dom";
/**
 * Internal dependencies
 */
import { Header } from "@/app/layout/root";
import ProjectComboBox from "./projectComboBox";

type ProjectDetailHeaderProps = {
  projectId: string;
};

export const EmployeeDetailHeader = ({ projectId }: ProjectDetailHeaderProps) => {
  const navigate = useNavigate();

  const onProjectChange = (name: string) => {
    navigate(`/project/${name}`);
  };

  return (
    <>
      <Header>
        <ProjectComboBox
          pageLength={20}
          className="w-full lg:w-fit"
          value={projectId as string}
          onSelect={onProjectChange}
        />
      </Header>
    </>
  );
};
