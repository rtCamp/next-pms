/**
 * External dependencies.
 */
import { Fragment, useCallback, useEffect, useState } from "react";
import { Spinner } from "@next-pms/design-system/components";
import { Button, Dialog, TextInput } from "@rtcamp/frappe-ui-react";
import { Search } from "@rtcamp/frappe-ui-react/icons";

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

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const { options, isLoading } = useRepositoryLookup({
    shouldFetch: open,
    query,
  });

  const handleAdd = useCallback(
    async (value: string) => {
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
      onOpenChange(false);
    },
    [options, connections, updateRepositories, onOpenChange],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      options={{ title: "Connect a GitHub repository" }}
    >
      <div className="flex flex-col gap-3">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search repositories"
          prefix={() => <Search className="h-4 w-4 text-ink-gray-5" />}
        />

        <div className="h-55 overflow-y-auto rounded-lg border border-outline-gray-2 px-2.5 py-2 scrollbar-thin">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="h-4 w-4" />
            </div>
          ) : options.length === 0 ? (
            <p className="py-6 text-center text-base text-ink-gray-5">
              No matching repositories
            </p>
          ) : (
            <ul className="flex flex-col gap-2 pb-2">
              {options.map((repo, index) => {
                const isConnected = connectedIds.has(repo.value);
                return (
                  <Fragment key={repo.value}>
                    {index > 0 && (
                      <li
                        aria-hidden
                        className="h-px w-full bg-outline-gray-1"
                      />
                    )}
                    <li className="flex items-center gap-1">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-base font-medium text-ink-gray-7">
                          {repo.label}
                        </span>
                        <span className="truncate text-[13px] text-ink-gray-5">
                          {repo.fullPath}
                        </span>
                      </div>
                      {isConnected ? (
                        <Button
                          variant="subtle"
                          theme="gray"
                          label="Connected"
                          disabled
                        />
                      ) : (
                        <Button
                          variant="subtle"
                          theme="gray"
                          label="Add"
                          onClick={() => handleAdd(repo.value)}
                        />
                      )}
                    </li>
                  </Fragment>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}
