/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { AlertTriangle, SmallDown } from "@rtcamp/frappe-ui-react/icons";
import { format, parseISO } from "date-fns";

export interface OverAllocatedDay {
  date: string;
  excessHours: number;
}

interface OverAllocationWarningProps {
  overAllocatedDays: OverAllocatedDay[];
}

function formatHours(hours: number): string {
  const rounded = Math.round(hours * 100) / 100;
  return `${rounded}h`;
}

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy");
}

export function OverAllocationWarning({
  overAllocatedDays,
}: OverAllocationWarningProps) {
  if (overAllocatedDays.length === 0) return null;

  const dayCount = overAllocatedDays.length;
  const totalExcess = overAllocatedDays.reduce(
    (sum, d) => sum + d.excessHours,
    0,
  );

  return (
    <Accordion.Root className="bg-(--color-violet-50) rounded-lg overflow-hidden">
      <Accordion.Item value="details">
        <Accordion.Header render={<div />}>
          <Accordion.Trigger className="w-full flex items-center gap-2 px-2.5 py-2 group">
            <AlertTriangle className="size-4 shrink-0 text-(--color-violet-700)" />
            <p className="flex-1 min-w-0 text-xs text-ink-gray-9 text-left">
              This allocation causes over-allocation on {dayCount}{" "}
              {dayCount === 1 ? "day" : "days"} (+{formatHours(totalExcess)}{" "}
              total)
            </p>
            <SmallDown className="size-4 shrink-0 text-ink-gray-7 transition-transform duration-200 group-data-panel-open:rotate-180" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="accordion-panel">
          <div className="flex flex-col gap-1.5 px-2.5 pb-2 pl-8 max-h-24 overflow-y-scroll scrollbar-thin [scrollbar-gutter:stable]">
            {overAllocatedDays.map((day) => (
              <div key={day.date} className="flex items-center gap-2">
                <span className="text-xs text-ink-gray-7">
                  {formatDate(day.date)}
                </span>
                <span
                  className={cn(
                    "bg-surface-violet-1 text-(--color-violet-700)",
                    "text-xs font-medium px-1.5 py-0.5 rounded-md",
                  )}
                >
                  {formatHours(day.excessHours)} over
                </span>
              </div>
            ))}
          </div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}
