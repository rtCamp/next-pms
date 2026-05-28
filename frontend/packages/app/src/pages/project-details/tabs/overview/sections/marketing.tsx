/**
 * External dependencies.
 */
import { useState } from "react";
import { Combobox, Select } from "@rtcamp/frappe-ui-react";
import {
  Article,
  Contact,
  PreviewOff,
  Quote,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useCustomerContactLookup } from "@/hooks/useCustomerContactLookup";
import { useProjectDetail } from "../../../context";
import { EditableField } from "../components/editableField";
import { OverviewSection } from "../components/overviewSection";
import type { OverviewFormApi } from "../index";

const EMPTY = "—";

const YES_NO_OPTIONS = [
  { label: "Yes", value: "1" },
  { label: "No", value: "0" },
];

const toYesNo = (value: string) =>
  value === "1" ? "Yes" : value === "0" ? "No" : EMPTY;

type MarketingProps = {
  form: OverviewFormApi;
  isEditing: boolean;
  submitting: boolean;
};

export function Marketing({ form, isEditing, submitting }: MarketingProps) {
  const customer = useProjectDetail((state) => state.project?.customer ?? "");
  const [contactSearch, setContactSearch] = useState("");
  const { options: contactOptions, isLoading: isContactLoading } =
    useCustomerContactLookup({
      customer,
      shouldFetch: isEditing,
      query: contactSearch,
    });

  return (
    <OverviewSection title="Marketing">
      <div className="flex w-207 max-w-full flex-wrap gap-4">
        <form.Field name="ndaSigned">
          {(field) => (
            <EditableField
              icon={<PreviewOff className="size-[18px]" />}
              label="NDA signed"
              value={toYesNo(field.state.value)}
              isEditing={isEditing}
            >
              <Select
                value={field.state.value}
                onChange={(v) => field.handleChange(v || "0")}
                options={YES_NO_OPTIONS}
                disabled={submitting}
              />
            </EditableField>
          )}
        </form.Field>

        <form.Field name="caseStudyApproved">
          {(field) => (
            <EditableField
              icon={<Article className="size-[18px]" />}
              label="Case study approved"
              value={toYesNo(field.state.value)}
              isEditing={isEditing}
            >
              <Select
                value={field.state.value}
                onChange={(v) => field.handleChange(v || "0")}
                options={YES_NO_OPTIONS}
                disabled={submitting}
              />
            </EditableField>
          )}
        </form.Field>

        <form.Field name="testimonialApproval">
          {(field) => (
            <EditableField
              icon={<Quote className="size-[18px]" />}
              label="Testimonial approval"
              value={toYesNo(field.state.value)}
              isEditing={isEditing}
            >
              <Select
                value={field.state.value}
                onChange={(v) => field.handleChange(v || "0")}
                options={YES_NO_OPTIONS}
                disabled={submitting}
              />
            </EditableField>
          )}
        </form.Field>

        <form.Field name="testimonialContact">
          {(field) => (
            <EditableField
              icon={<Contact className="size-[18px]" />}
              label="Testimonial contact"
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
      </div>
    </OverviewSection>
  );
}
