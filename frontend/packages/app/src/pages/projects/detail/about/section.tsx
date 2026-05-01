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
      <Accordion.Header>
        <div className="flex items-center gap-3 px-5 py-3">
          <Accordion.Trigger className="group flex flex-1 items-center gap-2 text-left">
            <SmallDown
              aria-hidden
              className="size-4 shrink-0 text-ink-gray-7 transition-transform group-data-[panel-open]:rotate-180"
            />
            <span className="flex-1 truncate text-base font-medium text-ink-gray-8">
              {title}
            </span>
          </Accordion.Trigger>
          {suffix}
        </div>
      </Accordion.Header>
      <Accordion.Panel className="accordion-panel">{children}</Accordion.Panel>
    </Accordion.Item>
  );
}
