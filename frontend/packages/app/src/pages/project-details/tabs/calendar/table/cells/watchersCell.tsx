/**
 * Internal dependencies.
 */
import { AvatarStack } from "../../avatarStack";
import type { UserRef } from "../../types";

export function WatchersCell({ watchers }: { watchers: UserRef[] }) {
  return <AvatarStack users={watchers} />;
}
