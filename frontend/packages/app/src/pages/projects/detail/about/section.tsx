/**
 * External dependencies.
 */
import type { ReactNode } from "react";
import { Accordion } from "@base-ui/react/accordion";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

interface SectionProps {
  value: string;
  title: string;
  suffix?: ReactNode;
  children?: ReactNode;
}

export function Section({ value, title, suffix, children }: SectionProps) {
  return (
    <Accordion.Item
      value={value}
      className="border-t border-outline-gray-1 first:border-t-0"
    >
      <Accordion.Header className="w-full flex justify-between items-center px-5 py-3">
        <Accordion.Trigger className="w-full flex items-center gap-3 group flex-1">
          <SmallDown
            aria-hidden
            className="size-4 shrink-0 text-ink-gray-7 transition-transform group-data-panel-open:rotate-180"
          />
          <span className="truncate font-medium text-base text-ink-gray-8">
            {title}
          </span>
        </Accordion.Trigger>
        {suffix}
      </Accordion.Header>
      <Accordion.Panel className="accordion-panel px-5 pb-4">
        {children}
      </Accordion.Panel>
    </Accordion.Item>
  );
}
