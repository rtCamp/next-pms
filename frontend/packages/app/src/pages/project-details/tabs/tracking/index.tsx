/**
 * External dependencies.
 */
import { useMemo } from "react";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";
import { getDefaultLayout } from "./constants";
import { useTracking } from "./context";
import { TrackingProvider } from "./provider";
import { WIDGETS } from "./widgetRegistry";

const ROW_COLUMNS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
};

export function Tracking() {
  return (
    <TrackingProvider>
      <TrackingContent />
    </TrackingProvider>
  );
}

function TrackingContent() {
  const billingType = useTracking((state) => state.tracking.billing_type);
  const layout = useMemo(() => getDefaultLayout(billingType), [billingType]);

  return (
    <div className="flex flex-col gap-6">
      {layout
        .filter((row) => row.length > 0)
        .map((row) => {
          const widgetLayout = row.length === 1 ? "row" : "stacked";

          return (
            <div
              key={row.join("|")}
              className={cn("grid gap-3", ROW_COLUMNS[row.length])}
            >
              {row.map((key) => {
                const Widget = WIDGETS[key];
                return <Widget key={key} layout={widgetLayout} />;
              })}
            </div>
          );
        })}
    </div>
  );
}
