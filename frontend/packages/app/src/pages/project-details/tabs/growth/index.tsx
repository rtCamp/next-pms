/**
 * External dependencies.
 */
import { useSearchParams } from "react-router";
import { mergeClassNames as cn } from "@next-pms/design-system";
import {
  DeleteActionDialog,
  Spinner,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { GROWTH_DETAIL_PARAM } from "./constants";
import { useGrowth } from "./context";
import { CreateGrowthModal } from "./create-growth";
import { GrowthDetailView } from "./detail";
import { GrowthHeader } from "./header";
import { GrowthListView } from "./list/listView";
import { GrowthProvider } from "./provider";

function GrowthContent() {
  const [searchParams] = useSearchParams();
  const growthId = searchParams.get(GROWTH_DETAIL_PARAM);
  const isLoading = useGrowth((c) => c.state.isLoading);
  const isCreateOpen = useGrowth((c) => c.state.isCreateOpen);
  const closeCreate = useGrowth((c) => c.actions.closeCreate);
  const deleteName = useGrowth((c) => c.state.deleteName);
  const closeDelete = useGrowth((c) => c.actions.closeDelete);
  const deleteGrowth = useGrowth((c) => c.actions.deleteGrowth);

  const deleteDialog = deleteName && (
    <DeleteActionDialog
      title="Delete growth initiative"
      description="Are you sure you want to delete this growth initiative? This action cannot be undone."
      onClose={closeDelete}
      onConfirm={() => deleteGrowth(deleteName)}
    />
  );

  if (growthId) {
    return (
      <>
        {deleteDialog}
        <GrowthDetailView growthId={growthId} />
      </>
    );
  }

  return (
    <div className="relative flex flex-col h-full">
      {deleteDialog}
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
