/**
 * External dependencies.
 */
import { TextEditor } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "../../../context";
import { OverviewSection } from "../components/overviewSection";

export function KeyGoals() {
  const html = useProjectDetail(
    (state) => state.project?.custom_key_goals ?? "",
  );

  if (!html) {
    return null;
  }

  return (
    <OverviewSection title="Key goals of the project">
      <TextEditor
        content={html}
        editable={false}
        fixedMenu={false}
        editorClass="text-sm text-ink-gray-7"
      />
    </OverviewSection>
  );
}
