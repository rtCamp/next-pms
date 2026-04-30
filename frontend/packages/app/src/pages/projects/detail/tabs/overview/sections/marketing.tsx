/**
 * External dependencies.
 */
import { Contact, EyeOff, FileText, Quote } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { OverviewMarketing } from "../types";
import { OverviewField } from "../components/overview-field";
import { OverviewSection } from "../components/overview-section";

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export function Marketing({ data }: { data: OverviewMarketing }) {
  return (
    <OverviewSection title="Marketing">
      <div className="flex w-[828px] max-w-full flex-wrap gap-4">
        <OverviewField
          icon={<EyeOff className="size-[18px]" />}
          label="NDA signed"
          value={yesNo(data.ndaSigned)}
        />
        <OverviewField
          icon={<FileText className="size-[18px]" />}
          label="Case study approved"
          value={yesNo(data.caseStudyApproved)}
        />
        <OverviewField
          icon={<Quote className="size-[18px]" />}
          label="Testimonial approval"
          value={yesNo(data.testimonialApproved)}
        />
        <OverviewField
          icon={<Contact className="size-[18px]" />}
          label="Testimonial contact"
          value={data.testimonialContact}
        />
      </div>
    </OverviewSection>
  );
}
