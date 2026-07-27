/**
 * External dependencies.
 */
import { useParams } from "react-router";

/**
 * Internal dependencies.
 */
import { CalendarContent } from "./calendarContent";
import { CalendarProvider } from "./provider";

export function CalendarTab() {
  const { projectId = "" } = useParams<{ projectId: string }>();

  return (
    <CalendarProvider projectId={projectId}>
      <CalendarContent />
    </CalendarProvider>
  );
}
