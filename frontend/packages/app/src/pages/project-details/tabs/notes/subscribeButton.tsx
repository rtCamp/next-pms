/**
 * External dependencies.
 */
import { Button, Tooltip, useToasts } from "@rtcamp/frappe-ui-react";
import {
  FrappeError,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { NoteSubscription } from "./types";
import { useProjectDetail } from "../../context";

export function SubscribeButton() {
  const projectId = useProjectDetail((s) => s.projectId);
  const toast = useToasts();
  const { data, isLoading, mutate } = useFrappeGetCall<{
    message: NoteSubscription;
  }>(
    "next_pms.timesheet.api.project_status_update.get_project_update_subscription",
    { project: projectId },
    projectId ? undefined : null,
    { revalidateOnFocus: false },
  );
  const { call: setSubscription, loading: isSaving } = useFrappePostCall<{
    message: NoteSubscription;
  }>(
    "next_pms.timesheet.api.project_status_update.set_project_update_subscription",
  );

  if (isLoading || !data) return null;

  const { subscribed, is_account_manager: isAccountManager } = data.message;

  if (isAccountManager) {
    return (
      <Tooltip text="Account managers are notified of every note">
        <span>
          <Button size="sm" variant="subtle" label="Subscribed" disabled />
        </span>
      </Tooltip>
    );
  }

  const toggle = async () => {
    try {
      const response = await setSubscription({
        project: projectId,
        subscribed: subscribed ? 0 : 1,
      });
      await mutate(response, { revalidate: false });
      toast.success(
        subscribed
          ? "Unsubscribed from project notes"
          : "Subscribed to project notes",
      );
    } catch (err) {
      toast.error(parseFrappeErrorMsg(err as FrappeError));
    }
  };

  return subscribed ? (
    <Button
      size="sm"
      variant="subtle"
      label="Unsubscribe"
      loading={isSaving}
      onClick={toggle}
    />
  ) : (
    <Button
      size="sm"
      variant="solid"
      theme="blue"
      label="Subscribe"
      loading={isSaving}
      onClick={toggle}
    />
  );
}
