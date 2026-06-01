/**
 * External dependencies.
 */
import { Dropdown, useToasts } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";
import { useFrappePostCall } from "frappe-react-sdk";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useRisks } from "./context";

interface RiskRowActionsProps {
  riskName: string;
  isFollowing?: boolean;
  onAfterFollow?: () => void;
  showFollow?: boolean;
}

export function RiskRowActions({
  riskName,
  isFollowing = false,
  onAfterFollow,
  showFollow = true,
}: RiskRowActionsProps) {
  const openEditRisk = useRisks((c) => c.actions.openEditRisk);
  const openDeleteRisk = useRisks((c) => c.actions.openDeleteRisk);
  const toast = useToasts();

  const { call: updateFollow } = useFrappePostCall(
    "frappe.desk.form.document_follow.update_follow",
  );

  const handleFollow = async () => {
    try {
      await updateFollow({
        doctype: "Risk",
        doc_name: riskName,
        following: !isFollowing,
      });
      toast.success(isFollowing ? "Unfollowed document" : "Following document");
      onAfterFollow?.();
    } catch (err) {
      toast.error(parseFrappeErrorMsg(err as FrappeError));
    }
  };

  return (
    <Dropdown
      placement="center"
      button={{
        variant: "ghost",
        icon: DotHorizontal,
      }}
      options={[
        {
          key: "edit",
          label: "Edit",
          onClick: () => openEditRisk(riskName),
        },
        {
          key: "delete",
          label: "Delete",
          theme: "red",
          onClick: () => openDeleteRisk(riskName),
        },
        ...(showFollow
          ? [
              {
                key: "follow",
                label: isFollowing ? "Unfollow" : "Follow",
                onClick: () => void handleFollow(),
              },
            ]
          : []),
      ]}
    />
  );
}
