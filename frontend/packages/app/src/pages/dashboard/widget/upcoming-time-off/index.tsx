/**
 * Internal dependencies.
 */
import { UpcomingTimeOffContent } from "./content";
import { UpcomingTimeOffProvider } from "./provider";

export default function UpcomingTimeOff() {
  return (
    <UpcomingTimeOffProvider>
      <UpcomingTimeOffContent />
    </UpcomingTimeOffProvider>
  );
}
