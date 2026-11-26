import { computed, inject, provide, ref, type InjectionKey } from "vue";
import { toast } from "frappe-ui";
import { useUnsavedChangesSource } from "@/composables/useUnsavedChanges";
import { useProjectDetails } from "@/pages/project-details/useProjectDetails";
import { errorMessage } from "@/utils/errors";
import { changedFields, toDraft, type OverviewDraft } from "./overview";
import { useContactNames } from "./useContactNames";

function createOverview() {
  const { doc, setValue } = useProjectDetails();

  const saved = computed(() => (doc.value ? toDraft(doc.value) : null));
  // Seeded from the Project on Edit and never from a later reload, so a realtime
  // update while editing keeps what the user typed.
  const draft = ref<OverviewDraft | null>(null);
  let seed: OverviewDraft | null = null;
  const saving = ref(false);

  const editing = computed(() => draft.value !== null);
  const changes = computed(() =>
    draft.value && seed ? changedFields(draft.value, seed) : {},
  );
  const dirty = computed(() => Object.keys(changes.value).length > 0);

  const contactNames = useContactNames(() => [
    saved.value?.custom_client_point_of_contact ?? "",
    saved.value?.custom_testimonial_contact ?? "",
  ]);

  function edit() {
    if (!doc.value) return;
    seed = toDraft(doc.value);
    draft.value = { ...seed };
  }

  function cancel() {
    draft.value = null;
  }

  async function save(onSaved?: () => void) {
    if (saving.value || !draft.value) return;
    saving.value = true;
    try {
      if (dirty.value) await setValue(changes.value);
      draft.value = null;
      toast.success("Overview updated");
      onSaved?.();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      saving.value = false;
    }
  }

  useUnsavedChangesSource({
    hasUnsavedChanges: () => dirty.value,
    saveChanges: (onSaved) => save(onSaved),
    discardChanges: cancel,
  });

  return {
    /** What the tab shows: the draft while editing, else the Project's values. */
    values: computed(() => draft.value ?? saved.value),
    /** The values being edited; `null` outside edit mode. */
    draft,
    editing,
    saving,
    /** Whether the draft differs from the Project. */
    dirty,
    customer: computed(() => doc.value?.customer ?? ""),
    /** A contact's full name, or its ID when the name isn't known. */
    contactLabel: (contactId: string) =>
      contactNames.value.get(contactId) ?? contactId,
    edit,
    cancel,
    save,
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
