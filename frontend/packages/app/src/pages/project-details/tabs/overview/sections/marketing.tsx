/**
 * External dependencies.
 */
import {
  Article,
  Contact,
  PreviewOff,
  Quote,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "../../../context";
import { OverviewField } from "../components/overviewField";
import { OverviewSection } from "../components/overviewSection";

const EMPTY = "—";

const toYesNo = (value: 0 | 1 | undefined) =>
  value === 1 ? "Yes" : value === 0 ? "No" : EMPTY;

export function Marketing() {
  const ndaSigned = useProjectDetail((state) =>
    toYesNo(state.project?.custom_restricted_under_nda),
  );
  const caseStudyApproved = useProjectDetail((state) =>
    toYesNo(state.project?.custom_permission_for_case_study),
  );
  const testimonialApproval = useProjectDetail((state) =>
    toYesNo(state.project?.custom_permission_for_testimonial),
  );
  const testimonialContact = useProjectDetail(
    (state) => state.project?.custom_testimonial_contact ?? EMPTY,
  );

  return (
    <OverviewSection title="Marketing">
      <div className="flex w-207 max-w-full flex-wrap gap-4">
        <OverviewField
          icon={<PreviewOff className="size-[18px]" />}
          label="NDA signed"
          value={ndaSigned}
        />
        <OverviewField
          icon={<Article className="size-[18px]" />}
          label="Case study approved"
          value={caseStudyApproved}
        />
        <OverviewField
          icon={<Quote className="size-[18px]" />}
          label="Testimonial approval"
          value={testimonialApproval}
        />
        <OverviewField
          icon={<Contact className="size-[18px]" />}
          label="Testimonial contact"
          value={testimonialContact}
        />
      </div>
    </OverviewSection>
  );
}
