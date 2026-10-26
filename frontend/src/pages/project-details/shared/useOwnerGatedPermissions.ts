import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { useSession } from "@/session";
import { ownerGatedPermissions } from "./permissions";

/** What the session may do with an owner-gated record whose owner is `ownerId`. */
export function useOwnerGatedPermissions(
  ownerId: MaybeRefOrGetter<string | null | undefined>,
) {
  const session = useSession();
  return computed(() =>
    ownerGatedPermissions(session.roles, session.userId, toValue(ownerId)),
  );
}
