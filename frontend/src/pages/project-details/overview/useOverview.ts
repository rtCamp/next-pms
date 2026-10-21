import { computed, inject, provide, type InjectionKey } from "vue";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { toDraft } from "./overview";
import { useContactNames } from "./useContactNames";

function createOverview() {
  const { doc } = useProjectDetails();

  const saved = computed(() => (doc.value ? toDraft(doc.value) : null));
  const contactNames = useContactNames(() => [
    saved.value?.custom_client_point_of_contact ?? "",
    saved.value?.custom_testimonial_contact ?? "",
  ]);

  return {
    /** The values the tab shows. */
    values: saved,
    customer: computed(() => doc.value?.customer ?? ""),
    /** A contact's full name, or its ID when it has none. */
    contactLabel: (contactId: string) =>
      contactNames.value.get(contactId) ?? contactId,
  };
}

export type Overview = ReturnType<typeof createOverview>;

const overviewKey: InjectionKey<Overview> = Symbol("overview");

/** The Overview tab's state, shared with its sections. */
export function provideOverview(): Overview {
  const overview = createOverview();
  provide(overviewKey, overview);
  return overview;
}

export function useOverview(): Overview {
  const overview = inject(overviewKey);
  if (!overview) {
    throw new Error("useOverview() needs provideOverview() in a parent");
  }
  return overview;
}
