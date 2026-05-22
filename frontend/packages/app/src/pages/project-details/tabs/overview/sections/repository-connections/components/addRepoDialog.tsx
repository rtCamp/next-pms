/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Button, Combobox, Dialog } from "@rtcamp/frappe-ui-react";
import { WebLink } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useRepositoryLookup } from "@/hooks/useRepositoryLookup";

type ConnectedRepo = {
  id: string;
  name: string;
  githubUrl: string;
};

type AddRepoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (repo: ConnectedRepo) => void;
  connectedIds: Set<string>;
};

export function AddRepoDialog({
  open,
  onOpenChange,
  onConnect,
  connectedIds,
}: AddRepoDialogProps) {
  const [query, setQuery] = useState("");

  const { options, isLoading } = useRepositoryLookup({
    shouldFetch: open,
    query,
    excludeIds: connectedIds,
  });

  const handlePick = useCallback(
    (value: string | null) => {
      if (!value) return;
      const opt = options.find((o) => o.value === value);
      if (!opt) return;
      onConnect({
        id: opt.value,
        name: opt.label,
        githubUrl: opt.githubUrl,
      });
      setQuery("");
      onOpenChange(false);
    },
    [options, onConnect, onOpenChange],
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
      actions={
        <div className="flex flex-1 items-center justify-end gap-1">
          <Button
            variant="ghost"
            label="Cancel"
            onClick={() => onOpenChange(false)}
          />
          <Button
            variant="outline"
            label="Create new on GitHub"
            iconRight={WebLink}
            link="https://github.com/new"
          />
        </div>
      }
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
