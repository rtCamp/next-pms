/**
 * External dependencies.
 */
import { Select } from "@rtcamp/frappe-ui-react";
import {
  AuthenticatedUserAlt,
  Branch,
  SolidPriorityHigh,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { EditableField } from "../components/editableField";
import { OverviewSection } from "../components/overviewSection";
import type { OverviewFormApi } from "../index";

const EMPTY = "—";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

const COMPLEXITY_OPTIONS = [
  { label: "EMPTY", value: "" },
  { label: "C1", value: "C1" },
  { label: "C2", value: "C2" },
  { label: "C3", value: "C3" },
];

const KEY_ACCOUNT_OPTIONS = [
  { label: "EMPTY", value: "" },
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

type SpecificsProps = {
  form: OverviewFormApi;
  isEditing: boolean;
  submitting: boolean;
};

export function Specifics({ form, isEditing, submitting }: SpecificsProps) {
  return (
    <OverviewSection title="Specifics">
      <div className="flex w-[828px] max-w-full flex-wrap gap-4">
        <form.Field name="priority">
          {(field) => (
            <EditableField
              icon={<SolidPriorityHigh className="size-[18px]" />}
              label="Priority"
              value={field.state.value || EMPTY}
              isEditing={isEditing}
            >
              <Select
                value={field.state.value}
                onChange={(v) => field.handleChange(v || "")}
                options={PRIORITY_OPTIONS}
                disabled={submitting}
              />
            </EditableField>
          )}
        </form.Field>
        <form.Field name="complexity">
          {(field) => (
            <EditableField
              icon={<Branch className="size-[18px]" />}
              label="Complexity"
              value={field.state.value || EMPTY}
              isEditing={isEditing}
            >
              <Select
                value={field.state.value}
                onChange={(v) => field.handleChange(v || "")}
                options={COMPLEXITY_OPTIONS}
                disabled={submitting}
              />
            </EditableField>
          )}
        </form.Field>
        <form.Field name="keyAccount">
          {(field) => (
            <EditableField
              icon={<AuthenticatedUserAlt className="size-[18px]" />}
              label="Key account"
              value={field.state.value || EMPTY}
              isEditing={isEditing}
            >
              <Select
                value={field.state.value}
                onChange={(v) => field.handleChange(v || "")}
                options={KEY_ACCOUNT_OPTIONS}
                disabled={submitting}
              />
            </EditableField>
          )}
        </form.Field>
      </div>
    </OverviewSection>
  );
}
