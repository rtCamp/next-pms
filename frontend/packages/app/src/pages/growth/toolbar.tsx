/**
 * External dependencies.
 */
import { useEffect, useMemo, useState } from "react";
import { Button, Combobox, Select, TextInput } from "@rtcamp/frappe-ui-react";
import { Search } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { CLIENT_PRIORITY_OPTIONS } from "@/pages/project-details/tabs/growth/constants";
import { useGrowth } from "@/pages/project-details/tabs/growth/context";
import { OwnerCombobox } from "@/pages/project-details/tabs/growth/toolbar/ownerCombobox";
import type { UserDetailsMap } from "@/pages/project-details/tabs/growth/types";
import { useUser } from "@/providers/user";
import { DEFAULT_PIPELINE_FILTERS, PIPELINE_SORT_OPTIONS } from "./constants";
import { usePipeline } from "./context";
import type { PipelineInitiative, PipelineSort, UsersByEmail } from "./types";

const toUserMap = (
  emails: (string | null)[],
  users: UsersByEmail,
): UserDetailsMap =>
  Object.fromEntries(
    [...new Set(emails.filter(Boolean) as string[])].map((email) => [
      email,
      users[email],
    ]),
  );

const ownerEmails = (
  items: PipelineInitiative[],
  field: "activity_owner" | "project_manager",
  selected: string,
) => [...items.map((item) => item[field]), selected];

export function PipelineToolbar() {
  const filters = usePipeline((c) => c.state.filters);
  const currency = usePipeline((c) => c.state.currency);
  const sort = usePipeline((c) => c.state.sort);
  const initiatives = usePipeline((c) => c.state.initiatives);
  const clients = usePipeline((c) => c.state.clients);
  const users = usePipeline((c) => c.state.users);
  const setFilters = usePipeline((c) => c.actions.setFilters);
  const setCurrency = usePipeline((c) => c.actions.setCurrency);
  const setSort = usePipeline((c) => c.actions.setSort);
  const categories = useGrowth((c) => c.state.categories);
  const currencies = useUser((s) => s.state.currencies);

  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebounce(search);
  useEffect(() => {
    setFilters({ search: debouncedSearch });
  }, [debouncedSearch, setFilters]);

  const clientOptions = useMemo(
    () =>
      Object.entries(clients).map(([name, client]) => ({
        label: client.customer_name,
        value: name,
      })),
    [clients],
  );
  const owners = useMemo(
    () =>
      toUserMap(
        ownerEmails(initiatives, "activity_owner", filters.activityOwner),
        users,
      ),
    [initiatives, filters.activityOwner, users],
  );
  const projectManagers = useMemo(
    () =>
      toUserMap(
        ownerEmails(initiatives, "project_manager", filters.projectManager),
        users,
      ),
    [initiatives, filters.projectManager, users],
  );
  const categoryOptions = useMemo(
    () => [
      { label: "All categories", value: "" },
      ...categories.map((c) => ({ label: c.name, value: c.name })),
    ],
    [categories],
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2 px-5 pt-3.5">
      <TextInput
        className="w-52"
        size="sm"
        type="search"
        placeholder="Search growth initiatives"
        aria-label="Search growth initiatives"
        value={search}
        prefix={() => <Search className="size-4 text-ink-gray-5" />}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="w-44">
        <Combobox
          placeholder="Client"
          options={clientOptions}
          value={filters.customer || null}
          onChange={(value) => setFilters({ customer: value ?? "" })}
          clearable
        />
      </div>
      <OwnerCombobox
        placeholder="Owner"
        owners={owners}
        value={filters.activityOwner}
        onChange={(activityOwner) => setFilters({ activityOwner })}
      />
      <OwnerCombobox
        placeholder="PM"
        owners={projectManagers}
        value={filters.projectManager}
        onChange={(projectManager) => setFilters({ projectManager })}
      />
      <Select
        size="sm"
        placeholder="Category"
        placeholderClassName="text-ink-gray-7"
        className="w-36 text-ink-gray-7"
        matchTriggerWidth
        value={filters.category}
        onChange={(e) => setFilters({ category: e.target.value as string })}
        options={categoryOptions}
      />
      <Select
        size="sm"
        placeholder="Priority"
        placeholderClassName="text-ink-gray-7"
        className="w-32 text-ink-gray-7"
        matchTriggerWidth
        value={filters.clientPriority}
        onChange={(e) =>
          setFilters({ clientPriority: e.target.value as string })
        }
        options={[
          { label: "All priorities", value: "" },
          ...CLIENT_PRIORITY_OPTIONS,
        ]}
      />
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          label="Clear"
          onClick={() => {
            setSearch("");
            setFilters(DEFAULT_PIPELINE_FILTERS);
          }}
        />
      )}
      <div className="flex-1" />
      <div className="w-28">
        <Combobox
          placeholder="Currency"
          options={currencies}
          value={currency}
          onChange={(value) => value && setCurrency(value)}
        />
      </div>
      <Select
        size="sm"
        className="w-40 text-ink-gray-7"
        matchTriggerWidth
        value={sort}
        onChange={(e) => setSort(e.target.value as PipelineSort)}
        options={PIPELINE_SORT_OPTIONS}
      />
    </div>
  );
}
