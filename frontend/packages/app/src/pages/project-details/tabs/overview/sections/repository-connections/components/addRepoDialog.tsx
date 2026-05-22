/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";
import { Button, Dialog, TextInput } from "@rtcamp/frappe-ui-react";
import {
  Search,
  SolidBranch,
  WebLink,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { AVAILABLE_REPOS } from "../fake-data";
import type { AvailableRepo } from "../types";

type AddRepoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (repo: AvailableRepo) => void;
  connectedIds: Set<string>;
};

export function AddRepoDialog({
  open,
  onOpenChange,
  onConnect,
  connectedIds,
}: AddRepoDialogProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return AVAILABLE_REPOS.filter((r) => !connectedIds.has(r.id)).filter(
      (r) =>
        q === "" ||
        r.name.toLowerCase().includes(q) ||
        r.fullPath.toLowerCase().includes(q),
    );
  }, [search, connectedIds]);

  const handleConnect = useCallback(
    (repo: AvailableRepo) => {
      onConnect(repo);
      setSearch("");
      onOpenChange(false);
    },
    [onConnect, onOpenChange],
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setSearch("");
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
      <div className="flex flex-col gap-3">
        <TextInput
          size="md"
          variant="outline"
          placeholder="Search repositories"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          prefix={() => <Search className="size-4 text-ink-gray-4" />}
        />
        <div className="border border-outline-gray-2 rounded-lg max-h-[220px] overflow-y-auto px-[10px] py-[8px]">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-ink-gray-4">
              No matching repositories
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((repo, i) => (
                <div key={repo.id}>
                  {i > 0 && (
                    <div className="border-b border-outline-gray-1 my-2" />
                  )}
                  <div className="flex items-center gap-1">
                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <SolidBranch className="size-4 shrink-0 text-ink-gray-7" />
                        <span className="text-base font-medium text-ink-gray-7 truncate">
                          {repo.name}
                        </span>
                      </div>
                      <div className="pl-[22px]">
                        <span className="text-sm text-ink-gray-5">
                          {repo.fullPath}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="subtle"
                      label="Connect"
                      onClick={() => handleConnect(repo)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
