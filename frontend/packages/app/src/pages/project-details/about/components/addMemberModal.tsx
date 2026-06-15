/**
 * External dependencies.
 */
import { Fragment, useCallback, useEffect, useState } from "react";
import { Spinner } from "@next-pms/design-system/components";
import {
  Avatar,
  Badge,
  Button,
  Dialog,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { Search } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useEmployeeLookup } from "@/hooks/useEmployeeLookup";

export type AddMemberModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMemberIds: string[];
  memberRoleByUserId?: Record<string, string>;
  onAdd?: (userId: string) => void;
  onRemove?: (userId: string) => void;
};

const ROLE_TAG_LABEL: Record<string, string> = {
  "Project Manager": "Project Manager",
  "Engineering Manager": "Lead Engineer",
};

export function AddMemberModal({
  open,
  onOpenChange,
  currentMemberIds,
  memberRoleByUserId,
  onAdd,
  onRemove,
}: AddMemberModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const { options, isLoading } = useEmployeeLookup({
    shouldFetch: open,
    query,
  });

  const handleAdd = useCallback(
    (id: string) => {
      onAdd?.(id);
    },
    [onAdd],
  );

  const handleRemove = useCallback(
    (id: string) => {
      onRemove?.(id);
    },
    [onRemove],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      options={{ title: "Add members" }}
    >
      <div className="flex flex-col gap-3">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members"
          prefix={() => <Search className="h-4 w-4 text-ink-gray-5" />}
        />

        <div className="h-55 overflow-y-auto rounded-lg border border-outline-gray-2 px-2.5 py-2 scrollbar-thin">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="h-4 w-4" />
            </div>
          ) : options.length === 0 ? (
            <p className="py-6 text-center text-base text-ink-gray-5">
              No matching employees
            </p>
          ) : (
            <ul className="flex flex-col gap-2 pb-2">
              {options.map((employee, index) => {
                const memberId = employee.userId ?? "";
                const isMember =
                  !!memberId && currentMemberIds.includes(memberId);
                const role = memberId
                  ? memberRoleByUserId?.[memberId]
                  : undefined;
                const roleLabel = role ? ROLE_TAG_LABEL[role] : undefined;

                return (
                  <Fragment key={employee.value}>
                    {index > 0 && (
                      <li
                        aria-hidden
                        className="h-px w-full bg-outline-gray-1"
                      />
                    )}
                    <li className="flex items-center gap-1">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Avatar
                          size="sm"
                          label={employee.label}
                          alt={employee.label}
                          image={employee.image}
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-base font-medium text-ink-gray-7">
                            {employee.label}
                          </span>
                          <span className="truncate text-[13px] text-ink-gray-5">
                            {employee.value}
                          </span>
                        </div>
                      </div>
                      {roleLabel && (
                        <Badge
                          size="sm"
                          variant="subtle"
                          theme="gray"
                          label={roleLabel}
                        />
                      )}
                      {isMember ? (
                        <Button
                          variant="subtle"
                          theme="red"
                          label="Remove"
                          disabled={!!role}
                          onClick={() => handleRemove(memberId)}
                        />
                      ) : (
                        <Button
                          variant="subtle"
                          theme="gray"
                          label="Add"
                          disabled={!memberId}
                          onClick={() => memberId && handleAdd(memberId)}
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
