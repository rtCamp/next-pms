/**
 * Internal dependencies.
 */
import { hasCapability } from "@/lib/utils";
import { useUser } from "@/providers/user";
import type { Capability } from "@/types";

export const useCapability = (capability: Capability) =>
  useUser(({ state }) => hasCapability(state.capabilities, capability));
