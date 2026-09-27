/**
 * External dependencies.
 */
import { mergeClassNames as cn } from "@next-pms/design-system";
import { Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { useGrowth } from "./context";
import { CreateGrowthModal } from "./create-growth";
import { GrowthHeader } from "./header";
import { GrowthListView } from "./list/listView";
import { GrowthProvider } from "./provider";

function GrowthContent() {
  const isLoading = useGrowth((c) => c.state.isLoading);
  const isCreateOpen = useGrowth((c) => c.state.isCreateOpen);
  const closeCreate = useGrowth((c) => c.actions.closeCreate);

  return (
    <div className="relative flex flex-col h-full">
      <CreateGrowthModal open={isCreateOpen} onClose={closeCreate} />
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
