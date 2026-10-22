/**
 * External dependencies.
 */
import { useMemo } from "react";

/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { usePipeline } from "./context";

export function PipelineSummary() {
  const initiatives = usePipeline((c) => c.state.initiatives);
  const currency = usePipeline((c) => c.state.currency);

  const { total, count, clientCount } = useMemo(() => {
    const open = initiatives.filter((item) => !item.is_closed);
    return {
      total: open.reduce((sum, item) => sum + item.converted_outcome, 0),
      count: open.length,
      clientCount: new Set(open.map((item) => item.customer)).size,
    };
  }, [initiatives]);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mx-5 mt-3 px-3 py-2 rounded-lg bg-surface-gray-1 text-base">
      <span className="text-ink-gray-5">
        Open pipeline{" "}
        <strong className="font-semibold text-ink-gray-8 tabular-nums">
          {currencyFormat(currency).format(total)}
        </strong>
      </span>
      <span className="text-ink-gray-5">
        {count} growth {count === 1 ? "initiative" : "initiatives"} across{" "}
        {clientCount} {clientCount === 1 ? "client" : "clients"}
      </span>
    </div>
  );
}
