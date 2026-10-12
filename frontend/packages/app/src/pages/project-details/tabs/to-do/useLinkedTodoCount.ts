/**
 * External dependencies.
 */
import { useFrappeGetDoc } from "frappe-react-sdk";

export function useLinkedTodoCount<T extends object = object>(
  doctype: string,
  name: string | null,
) {
  const { data, error, isValidating } = useFrappeGetDoc<
    T & { linked_todos?: { todo: string }[] }
  >(doctype, name ?? "", name ? undefined : null);

  return {
    doc: data,
    count: data?.linked_todos?.length ?? 0,
    isReady: Boolean(name) && !isValidating && Boolean(data || error),
  };
}
