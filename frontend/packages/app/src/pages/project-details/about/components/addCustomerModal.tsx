/**
 * External dependencies.
 */
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Dialog,
  Spinner,
  TextInput,
} from "@rtcamp/frappe-ui-react";
import { Search } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useCustomerContactLookup } from "@/hooks/useCustomerContactLookup";

export type AddCustomerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: string;
  currentCustomerIds: string[];
  onAdd?: (customerId: string) => void;
  onRemove?: (customerId: string) => void;
};

export function AddCustomerModal({
  open,
  onOpenChange,
  customer,
  currentCustomerIds,
  onAdd,
  onRemove,
}: AddCustomerModalProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const { options, isLoading } = useCustomerContactLookup({
    customer,
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
      options={{ title: "Add customers" }}
    >
      <div className="flex flex-col gap-3">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers"
          prefix={() => <Search className="h-4 w-4 text-ink-gray-5" />}
        />

        <div className="h-55 overflow-y-auto rounded-lg border border-outline-gray-2 px-2.5 py-2 scrollbar-thin">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="h-4 w-4" />
            </div>
          ) : options.length === 0 ? (
            <p className="py-6 text-center text-base text-ink-gray-5">
              No matching customers
            </p>
          ) : (
            <ul className="flex flex-col gap-2 pb-2">
              {options.map((contact, index) => {
                return (
                  <Fragment key={contact.value}>
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
                          label={contact.label}
                          alt={contact.label}
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-base font-medium text-ink-gray-7">
                            {contact.label}
                          </span>
                          <span className="truncate text-[13px] text-ink-gray-5">
                            {contact.value}
                          </span>
                        </div>
                      </div>
                      {currentCustomerIds.includes(contact.value) ? (
                        <Button
                          variant="subtle"
                          theme="red"
                          label="Remove"
                          onClick={() => handleRemove(contact.value)}
                        />
                      ) : (
                        <Button
                          variant="subtle"
                          theme="gray"
                          label="Add"
                          onClick={() => handleAdd(contact.value)}
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
