/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { useOwnerGatedPermissions } from "@/pages/project-details/useOwnerGatedPermissions";
import { GrowthDetailContent } from "./content";
import { GrowthDetailHeader } from "./header";
import { useGrowthDetail } from "./useGrowthDetail";

interface GrowthDetailViewProps {
  growthId: string;
}

export function GrowthDetailView({ growthId }: GrowthDetailViewProps) {
  const {
    growth,
    isLoading,
    attachments,
    followers,
    mutate,
    mutateAttachments,
    mutateFollowers,
    deleteUpdateEntry,
  } = useGrowthDetail(growthId);
  const { canEdit } = useOwnerGatedPermissions(growth?.activity_owner);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full">
        <Spinner isFull />
      </div>
    );
  }

  if (!growth) {
    return (
      <div className="flex items-center justify-center flex-1 h-full text-sm text-ink-gray-5">
        Growth initiative not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <GrowthDetailHeader
        growth={growth}
        followers={followers}
        onAfterFollow={() => void mutateFollowers()}
      />
      <GrowthDetailContent
        growth={growth}
        attachments={attachments}
        canEdit={canEdit}
        onAttachmentsChange={() => void mutateAttachments()}
        onUpdateLogChange={() => void mutate()}
        onDeleteUpdateEntry={deleteUpdateEntry}
      />
    </div>
  );
}
