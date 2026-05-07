/**
 * External dependencies.
 */
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { InvoiceBurnData } from "./types";

export function InvoiceBurnCard({ data }: { data: InvoiceBurnData }) {
  const { paid, unpaid, total } = data;
  const cap = Math.max(total, paid + unpaid);
  const paidPct = cap > 0 ? Math.min(100, (paid / cap) * 100) : 0;
  const unpaidPct = cap > 0 ? Math.min(100, (unpaid / cap) * 100) : 0;
  const ariaValueMax = Math.max(0, cap);
  const ariaValueNow = Math.min(ariaValueMax, Math.max(0, paid + unpaid));

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-base font-medium text-ink-gray-8">
          Invoice burn (to date)
        </h3>
        <span className="flex shrink-0 items-center gap-1 text-base font-normal text-ink-gray-6">
          All invoices
          <ArrowUpRight aria-hidden className="size-4" />
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ariaValueMax}
        aria-valuenow={ariaValueNow}
        className="flex h-2 w-full overflow-hidden rounded-full bg-surface-gray-3"
      >
        <div
          aria-hidden
          className="h-full bg-surface-violet-5"
          style={{ width: `${paidPct}%` }}
        />
        <div
          aria-hidden
          className="h-full bg-surface-blue-5"
          style={{ width: `${unpaidPct}%` }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 truncate text-base font-normal text-ink-gray-6">
            <span className="size-2 shrink-0 rounded-full bg-surface-violet-5" />
            <span className="truncate">Invoiced and paid</span>
          </span>
          <span className="shrink-0 text-base font-medium text-ink-gray-7">
            ${paid}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 truncate text-base font-normal text-ink-gray-6">
            <span className="size-2 shrink-0 rounded-full bg-surface-blue-5" />
            <span className="truncate">Invoiced but not paid</span>
          </span>
          <span className="shrink-0 text-base font-medium text-ink-gray-7">
            ${unpaid}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 truncate text-base font-normal text-ink-gray-6">
            <span className="size-2 shrink-0 rounded-full bg-surface-gray-3" />
            <span className="truncate">Total project amount</span>
          </span>
          <span className="shrink-0 text-base font-medium text-ink-gray-7">
            ${total}
          </span>
        </div>
      </div>
    </div>
  );
}
