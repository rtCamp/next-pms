/**
 * External dependencies
 */
import { RefObject } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Internal dependencies
 */
import { Header as ListViewHeader } from "@/app/components/list-view/header";
import { ButtonProps } from "@/app/components/list-view/types";

type ProjectDetailHeaderProps = {
  projectId: string;
  hideSaveChanges: boolean;
  formRef: RefObject<{
    submitForm: () => void;
  }>;
  projectName: string;
  disabled: boolean;
};

export const ProjectDetailHeader = ({
  projectId,
  hideSaveChanges,
  formRef,
  projectName,
  disabled,
}: ProjectDetailHeaderProps) => {
  const navigate = useNavigate();
  const onProjectChange = (value: string | string[]) => {
    navigate(`/project/${value}`);
  };

  return (
    <>
      <ListViewHeader
        filters={[
          {
            type: "search-project",
            value: projectId,
            handleChange: onProjectChange,
            hideQueryParam: true,
            projectName: projectName,
          },
        ]}
        showColumnSelector={true}
        showActions={true}
        buttons={[
          {
            title: "Save changes",
            handleClick: async () => {
              formRef.current?.submitForm();
              // await updateDoc("Project", projectId, formData);
            },
            hide: hideSaveChanges,
            label: "Save changes",
            disabled: disabled,
            variant: "ghost" as ButtonProps["variant"],
            className: "h-10 px-2 py-2",
          },
        ]}
      />
    </>
  );
};
