/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";
import { Lightbulb, SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { HelpTip } from "./types";

type TipListProps = {
  label: string;
  tips: HelpTip[];
};

export default function TipList({ label, tips }: TipListProps) {
  if (tips.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="px-2 pt-2 text-xs font-medium text-ink-gray-5">{label}</p>
      {tips.map((tip) => (
        <Accordion.Item key={tip.id} value={tip.id}>
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center gap-2 rounded-md p-2 text-left text-sm text-ink-gray-8 hover:bg-surface-gray-2">
              <Lightbulb className="size-4 shrink-0 text-ink-gray-5" />
              <span className="flex-1">{tip.title}</span>
              <SmallDown className="size-4 shrink-0 text-ink-gray-4 transition-transform duration-200 group-data-panel-open:rotate-180" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="accordion-panel">
            <div className="flex flex-col gap-2 pb-3 pl-8 pr-2 pt-1 text-sm leading-relaxed text-ink-gray-6">
              <p>{tip.body}</p>
              {tip.steps && (
                <ol className="list-decimal space-y-1 pl-4 marker:text-ink-gray-5">
                  {tip.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </div>
  );
}
