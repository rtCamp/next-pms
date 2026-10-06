/**
 * External dependencies.
 */
import {
  Dropdown,
  useToasts,
  type DropdownOptions,
} from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";
import { useFrappePostCall } from "frappe-react-sdk";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useRisks } from "./context";
import { useRiskPermissions } from "./useRiskPermissions";

interface RiskRowActionsProps {
  riskName: string;
  riskOwner?: string | null;
  isFollowing?: boolean;
  onAfterFollow?: () => void;
  showFollow?: boolean;
}

export function RiskRowActions({
  riskName,
  riskOwner,
  isFollowing = false,
  onAfterFollow,
  showFollow = true,
}: RiskRowActionsProps) {
  const openEditRisk = useRisks((c) => c.actions.openEditRisk);
  const openDeleteRisk = useRisks((c) => c.actions.openDeleteRisk);
  const { canEditRisk, canDeleteRisk } = useRiskPermissions(riskOwner);
  const toast = useToasts();

  const { call: updateFollow } = useFrappePostCall(
    "frappe.desk.form.document_follow.update_follow",
  );

  const handleFollow = async () => {
    try {
      const res = await updateFollow({
        doctype: "Risk",
        doc_name: riskName,
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
    ...(canEditRisk
      ? [
          {
            key: "edit",
            label: "Edit",
            onClick: () => openEditRisk(riskName),
          },
        ]
      : []),
    ...(canDeleteRisk
      ? [
          {
            key: "delete",
            label: "Delete",
            theme: "red" as const,
            onClick: () => openDeleteRisk(riskName),
          },
        ]
      : []),
    ...(showFollow
      ? [
          {
            key: "follow",
            label: isFollowing ? "Unfollow" : "Follow",
            onClick: () => void handleFollow(),
          },
        ]
      : []),
  ];

  if (options.length === 0) return null;

  return (
    <Dropdown
      placement="center"
      button={{
        variant: "ghost",
        icon: DotHorizontal,
      }}
      options={options}
    />
  );
}
