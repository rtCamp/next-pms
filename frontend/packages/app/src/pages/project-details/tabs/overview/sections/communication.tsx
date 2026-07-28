/**
 * External dependencies.
 */
import { useState } from "react";
import { Combobox, Select } from "@rtcamp/frappe-ui-react";
import { CalendarDeadline, Contact } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useCustomerContactLookup } from "@/hooks/useCustomerContactLookup";
import { useProjectDetail } from "../../../context";
import { EditableField } from "../components/editableField";
import { OverviewSection } from "../components/overviewSection";
import type { OverviewFormApi } from "../index";

const EMPTY = "—";

const FREQUENCY_OPTIONS = [
  { label: "Hourly", value: "Hourly" },
  { label: "Twice Daily", value: "Twice Daily" },
  { label: "Daily", value: "Daily" },
  { label: "Weekly", value: "Weekly" },
];

type CommunicationProps = {
  form: OverviewFormApi;
  isEditing: boolean;
  submitting: boolean;
};

export function Communication({
  form,
  isEditing,
  submitting,
}: CommunicationProps) {
  const customer = useProjectDetail((state) => state.project?.customer ?? "");
  const [contactSearch, setContactSearch] = useState("");
  const { options: contactOptions, isLoading: isContactLoading } =
    useCustomerContactLookup({
      customer,
      shouldFetch: isEditing,
      query: contactSearch,
    });

  return (
    <OverviewSection title="Communication">
      <div className="flex w-[828px] max-w-full flex-wrap gap-4">
        <form.Field name="pointOfContact">
          {(field) => (
            <EditableField
              icon={<Contact className="size-[18px]" />}
              label="Point of contact"
              value={field.state.value || EMPTY}
              isEditing={isEditing}
            >
              <Combobox
                loading={isContactLoading}
                options={contactOptions}
                placeholder="Select contact"
                searchValue={contactSearch}
                onSearchChange={setContactSearch}
                value={field.state.value || null}
                onChange={(v) => field.handleChange(v ?? "")}
                disabled={submitting || !customer}
                openOnFocus
              />
            </EditableField>
          )}
        </form.Field>

        <form.Field name="frequency">
          {(field) => (
            <EditableField
              icon={<CalendarDeadline className="size-[18px]" />}
              label="Time report frequency"
              value={field.state.value || EMPTY}
              isEditing={isEditing}
            >
              <Select
                value={field.state.value}
                onChange={(v) => field.handleChange(v || "")}
                options={FREQUENCY_OPTIONS}
                disabled={submitting}
              />
            </EditableField>
          )}
        </form.Field>
      </div>
    </OverviewSection>
  );
}
