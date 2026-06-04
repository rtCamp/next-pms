import { ProgressBar } from "@next-pms/design-system/components";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";
import { Invoicing } from "../types";

export function InvoiceBurnCell({ data }: { data: Invoicing }) {
  return (
    <div className="flex flex-1 flex-col gap-4 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base text-ink-gray-8 font-medium">
          Invoice Burn (to date)
        </span>
        <a
          href="/desk/sales-invoice"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-2 text-base text-ink-gray-6 hover:text-ink-gray-8"
        >
          All invoices
          <ArrowUpRight aria-hidden className="size-4" />
        </a>
      </div>
      <ProgressBar
        value={data.invoicedPaid}
        secondaryValue={data.invoicedPaid + data.invoicedUnpaid}
        maxValue={data.totalAmount}
        indicatorClassName="bg-surface-violet-4"
        secondaryIndicatorClassName="bg-surface-blue-5"
      />
      <div className="flex flex-col gap-2 text-base text-ink-gray-7">
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-violet-4" />
          <span className="min-w-0 flex-1 truncate">Invoiced and paid</span>
          <span>${data.invoicedPaid}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-blue-5" />
          <span className="min-w-0 flex-1 truncate">Invoiced and unpaid</span>
          <span>${data.invoicedUnpaid}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-4 rounded-full bg-surface-gray-3" />
          <span className="min-w-0 flex-1 truncate">Total Project Amount</span>
          <span>${data.totalAmount}</span>
        </div>
      </div>
    </div>
  );
}
