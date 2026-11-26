import { computed, ref } from "vue";
import { useCall } from "frappe-ui";
import { documentUrl } from "./useDocumentWrite";

/**
 * Reads a record of `doctype` before its delete is confirmed, for its title and
 * whether ToDos are linked to it. As React, an unreadable record reads as `null`
 * with no linked ToDos.
 */
export function useDeleteTarget<Doc extends object>(doctype: string) {
  const target = ref("");
  const call = useCall<Doc & { linked_todos?: { todo: string }[] }>({
    url: computed(() => documentUrl(doctype, target.value)),
    immediate: false,
  });

  return async function read(
    name: string,
  ): Promise<{ doc: Doc | null; hasTodos: boolean }> {
    target.value = name;
    const doc = await call.fetch();
    if (call.error || !doc) return { doc: null, hasTodos: false };
    return { doc, hasTodos: Boolean(doc.linked_todos?.length) };
  };
}
