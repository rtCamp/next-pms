/**
 * External dependencies.
 */
import { useSearchParams } from "react-router";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import { GROWTH_DETAIL_PARAM } from "./constants";
import { useGrowth } from "./context";
import { GrowthDetailView } from "./detail";
import { GrowthDialogs } from "./dialogs";
import { GrowthHeader } from "./header";
import { GrowthListView } from "./list/listView";
import { GrowthProvider } from "./provider";

function GrowthContent() {
  const [searchParams] = useSearchParams();
  const growthId = searchParams.get(GROWTH_DETAIL_PARAM);
  const isLoading = useGrowth((c) => c.state.isLoading);
  const projectId = useProjectDetail((s) => s.projectId);
  const project = useProjectDetail((s) => s.project);

  const dialogs = (
    <GrowthDialogs
      defaultProject={projectId}
      defaultCustomer={project?.customer}
      fallbackCurrency={project?.custom_currency}
    />
  );

  if (growthId) {
    return (
      <>
        {dialogs}
        <GrowthDetailView growthId={growthId} />
      </>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      {dialogs}
      <GrowthHeader />
      <div
        className={cn("flex flex-col flex-1 min-h-0", {
          "opacity-50 transition-opacity duration-150": isLoading,
        })}
      >
        <GrowthListView />
      </div>
      {isLoading && (
        <Spinner
          isFull
          className="absolute top-0 left-0 w-full h-full cursor-wait"
        />
      )}
    </div>
  );
}

export function GrowthTab() {
  return (
    <GrowthProvider>
      <GrowthContent />
    </GrowthProvider>
  );
}
