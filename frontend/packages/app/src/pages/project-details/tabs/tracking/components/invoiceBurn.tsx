import { ProgressBar } from "@next-pms/design-system/components";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";
import { currencyFormat } from "@/lib/utils";
import { useTracking } from "../context";
import { LegendItem } from "./legendItem";

export function InvoiceBurnCell() {
  const invoiceBurn = useTracking((state) => state.tracking.invoice_burn);
  const tracking = useTracking((state) => state.tracking);
  const formatter = currencyFormat(tracking.currency);
  const invoicedPaid = invoiceBurn.invoiced_and_paid;
  const invoicedUnpaid = invoiceBurn.invoiced_but_not_paid;
  const totalAmount = invoiceBurn.total_project_amount;

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
        value={invoicedPaid}
        secondaryValue={invoicedPaid + invoicedUnpaid}
        maxValue={totalAmount}
        indicatorClassName="bg-surface-violet-4"
        secondaryIndicatorClassName="bg-surface-blue-5"
      />
      <div className="flex flex-col gap-2 text-base text-ink-gray-7">
        <LegendItem
          className="bg-surface-violet-4"
          label="Invoiced and paid"
          value={formatter.format(invoicedPaid)}
        />
        <LegendItem
          className="bg-surface-blue-5"
          label="Invoiced and unpaid"
          value={formatter.format(invoicedUnpaid)}
        />
        <LegendItem
          className="bg-surface-gray-3"
          label="Total Project Amount"
          value={formatter.format(totalAmount)}
        />
      </div>
    </div>
  );
}
