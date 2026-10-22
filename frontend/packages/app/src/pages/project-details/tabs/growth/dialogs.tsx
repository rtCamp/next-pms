/**
 * External dependencies.
 */
import { DeleteActionDialog } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { GROWTH_DOCTYPE } from "./constants";
import { useGrowth } from "./context";
import { CreateGrowthModal } from "./create-growth";
import { useLinkedTodoCount } from "../to-do/useLinkedTodoCount";
import { getDeleteDescription } from "../to-do/utils";

interface GrowthDialogsProps {
  defaultProject?: string | null;
  defaultCustomer?: string | null;
  fallbackCurrency?: string | null;
}

export function GrowthDialogs({
  defaultProject,
  defaultCustomer,
  fallbackCurrency,
}: GrowthDialogsProps) {
  const isCreateOpen = useGrowth((c) => c.state.isCreateOpen);
  const createStatus = useGrowth((c) => c.state.createStatus);
  const editName = useGrowth((c) => c.state.editName);
  const deleteName = useGrowth((c) => c.state.deleteName);
  const closeCreate = useGrowth((c) => c.actions.closeCreate);
  const closeDelete = useGrowth((c) => c.actions.closeDelete);
  const deleteGrowth = useGrowth((c) => c.actions.deleteGrowth);
  const deleteTarget = useLinkedTodoCount<{ activity: string }>(
    GROWTH_DOCTYPE,
    deleteName,
  );

  return (
    <>
      <CreateGrowthModal
        open={isCreateOpen}
        onClose={closeCreate}
        growthName={editName}
        defaultProject={defaultProject}
        defaultCustomer={defaultCustomer}
        defaultStatus={createStatus}
        fallbackCurrency={fallbackCurrency}
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
}
