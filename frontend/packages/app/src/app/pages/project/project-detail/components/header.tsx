/**
 * External dependencies
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@next-pms/design-system/components";
import { useFrappeUpdateDoc } from "frappe-react-sdk";
import type { KeyedMutator } from "swr";

/**
 * Internal dependencies
 */
import { Header as ListViewHeader } from "@/app/components/list-view/header";
import { ButtonProps } from "@/app/components/list-view/types";
import { parseFrappeErrorMsg } from "@/lib/utils";

type ProjectDetailHeaderProps = {
  projectId: string;
  hideSaveChanges: boolean;
  formData: Record<string, string | number | null>;
  setHideSaveChanges: React.Dispatch<React.SetStateAction<boolean>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate: KeyedMutator<any>;
};

export const ProjectDetailHeader = ({
  projectId,
  hideSaveChanges,
  formData,
  setHideSaveChanges,
  mutate,
}: ProjectDetailHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const onProjectChange = (value: string | string[]) => {
    navigate(`/project/${value}`);
  };

  const { updateDoc, loading, error, isCompleted } = useFrappeUpdateDoc();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [callback, setCallBack] = useState<KeyedMutator<any>>();

  useEffect(() => {
    if (isCompleted) {
      setHideSaveChanges(true);
      toast({
        variant: "success",
        description: "Project updated",
      });
      mutate();
      // updates project list
      callback?.then();
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [loading, error]);

  const updateProjectList = (callback: VoidFunction) => {
    setCallBack(callback);
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
            mutate: updateProjectList,
          },
        ]}
        showColumnSelector={true}
        showActions={true}
        buttons={[
          {
            title: "Save changes",
            handleClick: async () => {
              await updateDoc("Project", projectId, formData);
            },
            hide: hideSaveChanges,
            label: "Save changes",
            disabled: loading,
            variant: "ghost" as ButtonProps["variant"],
            className: "h-10 px-2 py-2",
          },
        ]}
      />
    </>
  );
};
