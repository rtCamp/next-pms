/**
 * External dependencies.
 */
import { useState } from "react";

/**
 * Internal dependencies.
 */
import { ClientFeedbackView } from "./clientFeedbackView";
import { FeedbackToolbar } from "./feedbackToolbar";
import { FeedbackProvider } from "./provider";
import { TeamFeedbackView } from "./teamFeedbackView";
import type { FeedbackType } from "./types";

export function Feedback() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("client");

  return (
    <FeedbackProvider>
      <div>
        <FeedbackToolbar
          feedbackType={feedbackType}
          setFeedbackType={setFeedbackType}
        />

        {feedbackType === "client" && <ClientFeedbackView />}
        {feedbackType === "team" && <TeamFeedbackView />}
      </div>
    </FeedbackProvider>
  );
}
