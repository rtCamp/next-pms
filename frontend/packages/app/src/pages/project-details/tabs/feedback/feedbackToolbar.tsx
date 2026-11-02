/**
 * External dependencies.
 */
import { InfoHoverCard } from "@next-pms/design-system/components";
import { Button, Dropdown } from "@rtcamp/frappe-ui-react";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { FEEDBACK_HELP } from "./help";
import type { FeedbackType } from "./types";

type FeedbackToolbarProps = {
  feedbackType: FeedbackType;
  setFeedbackType: (type: FeedbackType) => void;
};

export function FeedbackToolbar({
  feedbackType,
  setFeedbackType,
}: FeedbackToolbarProps) {
  const feedbackTypeLabel =
    feedbackType === "client" ? "Client feedback" : "Team feedback";

  const feedbackTypeOptions = [
    {
      key: "client",
      label: "Client feedback",
      onClick: () => setFeedbackType("client"),
    },
    {
      key: "team",
      label: "Team feedback",
      onClick: () => setFeedbackType("team"),
    },
  ];

  return (
    <div className="flex items-center justify-between mb-3.5">
      <div className="flex min-w-0 items-center gap-1.5">
        <Dropdown options={feedbackTypeOptions} placement="left">
          <Button
            type="button"
            variant="ghost"
            className="text-xl font-semibold text-ink-gray-7"
            label={feedbackTypeLabel}
            iconRight={() => <SmallDown className="size-4" />}
          />
        </Dropdown>
        {feedbackType === "client" && (
          <InfoHoverCard help={FEEDBACK_HELP.client} />
        )}
      </div>
      <Button
        variant="solid"
        label="Schedule Feedback"
        className="text-sm"
        link="/desk/customer-feedback-schedule/"
        rel="noopener noreferrer"
      />
    </div>
  );
}
