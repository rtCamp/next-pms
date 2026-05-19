/**
 * External dependencies.
 */
import { TextEditor } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { OverviewSection } from "../components/overview-section";

export function KeyGoals({ html }: { html: string }) {
  return (
    <OverviewSection title="Key goals of the project">
      <TextEditor content={html} editable={false} fixedMenu={false} />
    </OverviewSection>
  );
}
