/**
 * External dependencies.
 */
import { Contact, EyeOff, FileText, Quote } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "../../../context";
import { OverviewField } from "../components/overviewField";
import { OverviewSection } from "../components/overviewSection";

const EMPTY = "—";

export function Marketing() {
  const testimonialContact = useProjectDetail(
    (state) => state.project?.custom_testimonial_contact ?? EMPTY,
  );

  return (
    <OverviewSection title="Marketing">
      <div className="flex w-207 max-w-full flex-wrap gap-4">
        <OverviewField
          icon={<EyeOff className="size-[18px]" />}
          label="NDA signed"
          value={EMPTY}
        />
        <OverviewField
          icon={<FileText className="size-[18px]" />}
          label="Case study approved"
          value={EMPTY}
        />
        <OverviewField
          icon={<Quote className="size-[18px]" />}
          label="Testimonial approval"
          value={EMPTY}
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
