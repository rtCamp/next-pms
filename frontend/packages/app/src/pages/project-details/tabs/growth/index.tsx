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
import { GROWTH_DETAIL_PARAM, GROWTH_DOCTYPE } from "./constants";
import { useGrowth } from "./context";
import { CreateGrowthModal } from "./create-growth";
import { GrowthDetailView } from "./detail";
import { GrowthHeader } from "./header";
import { GrowthListView } from "./list/listView";
import { GrowthProvider } from "./provider";
import { useLinkedTodoCount } from "../to-do/useLinkedTodoCount";
import { getDeleteDescription } from "../to-do/utils";

function GrowthContent() {
  const [searchParams] = useSearchParams();
  const growthId = searchParams.get(GROWTH_DETAIL_PARAM);
  const isLoading = useGrowth((c) => c.state.isLoading);
  const isCreateOpen = useGrowth((c) => c.state.isCreateOpen);
  const closeCreate = useGrowth((c) => c.actions.closeCreate);
  const editName = useGrowth((c) => c.state.editName);
  const deleteName = useGrowth((c) => c.state.deleteName);
  const closeDelete = useGrowth((c) => c.actions.closeDelete);
  const deleteGrowth = useGrowth((c) => c.actions.deleteGrowth);
  const deleteTarget = useLinkedTodoCount<{ activity: string }>(
    GROWTH_DOCTYPE,
    deleteName,
  );

  const dialogs = (
    <>
      <CreateGrowthModal
        open={isCreateOpen}
        onClose={closeCreate}
        growthName={editName}
      />
      {deleteName && deleteTarget.isReady && (
        <DeleteActionDialog
          title="Delete growth initiative"
          description={getDeleteDescription(
            "growth initiative",
            deleteTarget.doc?.activity ?? deleteName,
            deleteTarget.count > 0,
          )}
          onClose={closeDelete}
          onConfirm={() => deleteGrowth(deleteName)}
        />
      )}
    </>
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
