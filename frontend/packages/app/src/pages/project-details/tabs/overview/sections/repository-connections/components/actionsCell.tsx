/**
 * External dependencies.
 */
import { Dropdown } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { RepoConnection } from "../types";

type ActionsCellProps = {
  repo: RepoConnection;
  onUnlink: (id: string) => void;
};

export function ActionsCell({ repo, onUnlink }: ActionsCellProps) {
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
          onClick: () => onUnlink(repo.id),
        },
      ]}
    />
  );
}
