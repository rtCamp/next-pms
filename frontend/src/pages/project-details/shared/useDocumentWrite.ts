import { computed, ref } from "vue";
import { useCall } from "frappe-ui";

type Params = Record<string, unknown>;

export function documentUrl(doctype: string, name = "") {
  const base = `/api/v2/document/${encodeURIComponent(doctype)}`;
  return name ? `${base}/${encodeURIComponent(name)}` : base;
}

/**
 * A write to one document of `doctype` (`PUT` saves values, `DELETE` deletes it), on a
 * call of its own: a new submit aborts the one in flight, so writes that may overlap
 * each need their own.
 */
export function useDocumentWrite<Result = unknown>(
  doctype: string,
  method: "PUT" | "DELETE",
) {
  const target = ref("");
  const call = useCall<Result, Params>({
    url: computed(() => documentUrl(doctype, target.value)),
    method,
    immediate: false,
  });
  return (name: string, values: Params = {}) => {
    target.value = name;
    return call.submit(values);
  };
}
