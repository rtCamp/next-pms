/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Combobox, Dialog } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useRepositoryLookup } from "@/hooks/useRepositoryLookup";
import { useProjectDetail } from "../../../../../context";

type AddRepoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectedIds: Set<string>;
};

export function AddRepoDialog({
  open,
  onOpenChange,
  connectedIds,
}: AddRepoDialogProps) {
  const [query, setQuery] = useState("");

  const connections = useProjectDetail(
    (s) => s.project?.custom_project_repository_connections,
  );
  const updateRepositories = useProjectDetail((s) => s.updateRepositories);

  const { options, isLoading } = useRepositoryLookup({
    shouldFetch: open,
    query,
    excludeIds: connectedIds,
  });

  const handlePick = useCallback(
    async (value: string | null) => {
      if (!value) return;
      const opt = options.find((o) => o.value === value);
      if (!opt) return;
      const next = [
        ...(connections ?? []).map((c) => ({
          name: c.name,
          github_repository: c.github_repository ?? "",
        })),
        { github_repository: opt.value },
      ];
      await updateRepositories(next);
      setQuery("");
      onOpenChange(false);
    },
    [options, connections, updateRepositories, onOpenChange],
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setQuery("");
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      options={{ title: "Connect a GitHub repository" }}
    >
      <Combobox
        options={options}
        searchValue={query}
        onSearchChange={setQuery}
        onChange={handlePick}
        placeholder="Search repositories"
        loading={isLoading}
        emptyMessage="No matching repositories"
        openOnFocus
      />
    </Dialog>
  );
}
