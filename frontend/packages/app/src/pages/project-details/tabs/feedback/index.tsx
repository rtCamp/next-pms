/**
 * External dependencies.
 */
import { useState } from "react";

/**
 * Internal dependencies.
 */
import { ClientFeedbackView } from "./clientFeedbackView";
import { FeedbackToolbar } from "./feedbackToolbar";
import { MOCK_TEAM_FEEDBACK } from "./mock-data";
import { TeamFeedbackView } from "./teamFeedbackView";
import type { FeedbackType } from "./types";

export function Feedback() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("client");
  const [selectedMonth, setSelectedMonth] = useState("2026-04");

  return (
    <div>
      <FeedbackToolbar
        feedbackType={feedbackType}
        setFeedbackType={setFeedbackType}
      />

      {feedbackType === "client" && (
        <ClientFeedbackView
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />
      )}

      {feedbackType === "team" && (
        <TeamFeedbackView rows={MOCK_TEAM_FEEDBACK} />
      )}
    </div>
  );
}
