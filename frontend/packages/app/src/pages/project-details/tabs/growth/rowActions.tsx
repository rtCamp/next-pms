/**
 * External dependencies.
 */
import {
  Dropdown,
  useToasts,
  type DropdownOptions,
} from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";
import { useFrappePostCall, type FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useOwnerGatedPermissions } from "@/pages/project-details/useOwnerGatedPermissions";
import { GROWTH_DOCTYPE } from "./constants";
import { useGrowth } from "./context";

interface GrowthRowActionsProps {
  growthName: string;
  activityOwner: string | null;
  isFollowing?: boolean;
  onAfterFollow?: () => void;
  showFollow?: boolean;
}

export function GrowthRowActions({
  growthName,
  activityOwner,
  isFollowing = false,
  onAfterFollow,
  showFollow = true,
}: GrowthRowActionsProps) {
  const openEdit = useGrowth((c) => c.actions.openEdit);
  const openDelete = useGrowth((c) => c.actions.openDelete);
  const { canEdit, canDelete } = useOwnerGatedPermissions(activityOwner);
  const toast = useToasts();
  const { call: updateFollow } = useFrappePostCall(
    "frappe.desk.form.document_follow.update_follow",
  );

  const handleFollow = async () => {
    try {
      const res = await updateFollow({
        doctype: GROWTH_DOCTYPE,
        doc_name: growthName,
        following: !isFollowing,
      });
      if (!isFollowing && !res?.message) {
        toast.error("Document follow is not enabled for current user.");
        return;
      }
      toast.success(isFollowing ? "Unfollowed document" : "Following document");
      onAfterFollow?.();
    } catch (err) {
      toast.error(parseFrappeErrorMsg(err as FrappeError));
    }
  };

  const options: DropdownOptions = [
    ...(showFollow
      ? [
          {
            key: "follow",
            label: isFollowing ? "Unfollow" : "Follow",
            onClick: () => void handleFollow(),
          },
        ]
      : []),
    ...(canEdit
      ? [{ key: "edit", label: "Edit", onClick: () => openEdit(growthName) }]
      : []),
    ...(canDelete
      ? [
          {
            key: "delete",
            label: "Delete",
            theme: "red" as const,
            onClick: () => openDelete(growthName),
          },
        ]
      : []),
  ];

  if (options.length === 0) return null;

  return (
    <Dropdown
      placement="center"
      button={{ variant: "ghost", icon: DotHorizontal }}
      options={options}
    />
  );
}
