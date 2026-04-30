/**
 * Internal dependencies.
 */
import { Accordion } from "./accordion";
import { AboutSection } from "./aboutSection";

const SECTION_IDS = [
  "summary",
  "details",
  "links",
  "budget",
  "progress",
  "members",
  "customers",
] as const;

const SECTIONS: { id: (typeof SECTION_IDS)[number]; title: string }[] = [
  { id: "summary", title: "Summary" },
  { id: "details", title: "Project details" },
  { id: "links", title: "Links" },
  { id: "budget", title: "Budget burn" },
  { id: "progress", title: "Progress (hours)" },
  { id: "members", title: "Members" },
  { id: "customers", title: "Customers" },
];

export function AboutThisProject() {
  return (
    <section className="flex h-full flex-col">
      <header className="border-b border-outline-gray-1 px-5 py-3">
        <h2 className="text-base font-medium text-ink-gray-8">
          About this project
        </h2>
      </header>
      <Accordion.Root
        defaultValue={[...SECTION_IDS]}
        className="flex flex-col"
      >
        {SECTIONS.map((section) => (
          <AboutSection key={section.id} value={section.id} title={section.title} />
        ))}
      </Accordion.Root>
    </section>
  );
}
