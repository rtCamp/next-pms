import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { useSession } from "@/session";
import { ownerGatedPermissions, riskPermissions } from "./permissions";

/** What the session may do with an owner-gated record whose owner is `ownerId`. */
export function useOwnerGatedPermissions(
  ownerId: MaybeRefOrGetter<string | null | undefined>,
) {
  const session = useSession();
  return computed(() =>
    ownerGatedPermissions(
      session.capabilities,
      session.userId,
      toValue(ownerId),
    ),
  );
}

/** What the session may do with a risk. */
export function useRiskPermissions() {
  const session = useSession();
  return computed(() => riskPermissions(session.capabilities));
}
