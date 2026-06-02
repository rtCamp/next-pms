/**
 * External dependencies.
 */
import { useState } from "react";
import { Combobox, TextInput } from "@rtcamp/frappe-ui-react";
import { Location, SearchAlt, Tag1 } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useTerritoryLookup } from "@/hooks/useTerritoryLookup";
import { useUtmSourceLookup } from "@/hooks/useUtmSourceLookup";
import { EditableField } from "../components/editableField";
import { OverviewSection } from "../components/overviewSection";
import type { OverviewFormApi } from "../index";

const EMPTY = "—";

type SourcingProps = {
  form: OverviewFormApi;
  isEditing: boolean;
  submitting: boolean;
};

export function Sourcing({ form, isEditing, submitting }: SourcingProps) {
  const [sourceSearch, setSourceSearch] = useState("");
  const { options: sourceOptions, isLoading: isSourceLoading } =
    useUtmSourceLookup({
      shouldFetch: isEditing,
      query: sourceSearch,
    });

  const [territorySearch, setTerritorySearch] = useState("");
  const { options: territoryOptions, isLoading: isTerritoryLoading } =
    useTerritoryLookup({
      shouldFetch: isEditing,
      query: territorySearch,
    });

  return (
    <OverviewSection title="Sourcing">
      <div className="flex w-[828px] max-w-full flex-wrap gap-4">
        <form.Field name="source">
          {(field) => (
            <EditableField
              icon={<SearchAlt className="size-[18px]" />}
              label="Source"
              value={field.state.value || EMPTY}
              isEditing={isEditing}
            >
              <Combobox
                loading={isSourceLoading}
                options={sourceOptions}
                placeholder="Select source"
                searchValue={sourceSearch}
                onSearchChange={setSourceSearch}
                value={field.state.value || null}
                onChange={(v) => field.handleChange(v ?? "")}
                disabled={submitting}
                openOnFocus
              />
            </EditableField>
          )}
        </form.Field>

        <form.Field name="primaryLocation">
          {(field) => (
            <EditableField
              icon={<Location className="size-[18px]" />}
              label="Primary location"
              value={field.state.value || EMPTY}
              isEditing={isEditing}
            >
              <Combobox
                loading={isTerritoryLoading}
                options={territoryOptions}
                placeholder="Select primary location"
                searchValue={territorySearch}
                onSearchChange={setTerritorySearch}
                value={field.state.value || null}
                onChange={(v) => field.handleChange(v ?? "")}
                disabled={submitting}
                openOnFocus
              />
            </EditableField>
          )}
        </form.Field>

        <form.Field name="previousCms">
          {(field) => (
            <EditableField
              icon={<Tag1 className="size-[18px]" />}
              label="Previous CMS"
              value={field.state.value || EMPTY}
              isEditing={isEditing}
            >
              <TextInput
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={submitting}
              />
            </EditableField>
          )}
        </form.Field>
      </div>
    </OverviewSection>
  );
}
