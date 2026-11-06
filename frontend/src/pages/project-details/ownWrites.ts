import type { ListUpdate } from "@/composables/useDoctypeListUpdates";

/** How long after a local write its own realtime echo is still skipped. */
export const OWN_WRITE_ECHO_MS = 10_000;

/**
 * Tells this page's own writes from other changes in a doctype's `list_update`
 * events. A local write refetches by itself, so its echo is skipped: any event while
 * a write is in flight, and the user's first event for the written document after
 * it. An event skipped during a write that then fails calls `onMissedUpdate`.
 */
export function createOwnWrites(options: {
  userId: () => string;
  onMissedUpdate: () => void;
}) {
  let writesInFlight = 0;
  let missedUpdate = false;
  const ownWrites = new Map<string, number>();

  /** Runs `write`, remembering the document `nameOf` names in its result. */
  async function localWrite<T>(
    write: () => Promise<T>,
    nameOf: (result: T) => string | undefined,
  ): Promise<T> {
    writesInFlight++;
    try {
      const result = await write();
      const name = nameOf(result);
      if (name) ownWrites.set(name, Date.now() + OWN_WRITE_ECHO_MS);
      return result;
    } catch (error) {
      if (missedUpdate) options.onMissedUpdate();
      throw error;
    } finally {
      if (--writesInFlight === 0) missedUpdate = false;
    }
  }

  function isOwnEcho({ name, user }: ListUpdate): boolean {
    if (writesInFlight) {
      missedUpdate = true;
      return true;
    }
    if (!name || user !== options.userId()) return false;
    const until = ownWrites.get(name);
    ownWrites.delete(name);
    return until !== undefined && Date.now() <= until;
  }

  return { localWrite, isOwnEcho };
}
