import { computed, toValue, watch, type MaybeRefOrGetter } from "vue";
import { useCall } from "frappe-ui";

interface ContactItem {
  name: string;
  full_name?: string | null;
}

/**
 * The full names of the given Contacts, by ID. A contact without a name, or one
 * that couldn't be loaded, maps to nothing; callers show the ID instead.
 */
export function useContactNames(contactIds: MaybeRefOrGetter<string[]>) {
  const ids = computed(() => [...new Set(toValue(contactIds).filter(Boolean))]);

  const call = useCall<ContactItem[] | null, Record<string, string | number>>({
    url: "/api/v2/method/frappe.client.get_list",
    params: () => ({
      doctype: "Contact",
      fields: JSON.stringify(["name", "full_name"]),
      filters: JSON.stringify([["name", "in", ids.value]]),
      limit_page_length: ids.value.length,
    }),
    immediate: false,
  });

  watch(
    () => ids.value.join("\n"),
    () => {
      if (ids.value.length) call.fetch();
    },
    { immediate: true },
  );

  return computed(() => {
    const names = new Map<string, string>();
    for (const contact of call.data ?? []) {
      if (contact.full_name) names.set(contact.name, contact.full_name);
    }
    return names;
  });
}
