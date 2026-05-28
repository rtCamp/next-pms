/**
 * External dependencies.
 */
import { Dropdown } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "../../../../../context";

type ActionsCellProps = {
  repoId: string;
};

export function ActionsCell({ repoId }: ActionsCellProps) {
  const connections = useProjectDetail(
    (s) => s.project?.custom_project_repository_connections,
  );
  const updateRepositories = useProjectDetail((s) => s.updateRepositories);

  const handleUnlink = () => {
    const next = (connections ?? [])
      .filter((c) => c.name !== repoId)
      .map((c) => ({
        name: c.name,
        github_repository: c.github_repository ?? "",
      }));
    updateRepositories(next);
  };

  return (
    <Dropdown
      placement="right"
      button={{
        variant: "ghost",
        icon: DotHorizontal,
      }}
      options={[
        {
          label: "Unlink repository",
          key: "unlink",
          theme: "red",
          onClick: handleUnlink,
        },
      ]}
    />
  );
}
