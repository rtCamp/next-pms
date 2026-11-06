import { computed, toValue, watch, type MaybeRefOrGetter } from "vue";
import { useCall } from "frappe-ui";
import { ATTACHMENT_LIMIT, FOLLOWER_LIMIT, GET_LIST_URL } from "./constants";
import type { FileAttachment, Person } from "./types";

type Params = Record<string, unknown>;

/** Reads a list for the record `name` whenever it changes; nothing while `name` is empty. */
function useRecordList<Row>(
  name: MaybeRefOrGetter<string>,
  params: (name: string) => Params,
) {
  const call = useCall<Row[], Params>({
    url: GET_LIST_URL,
    params: () => params(toValue(name)),
    immediate: false,
  });
  watch(
    () => toValue(name),
    (current) => {
      if (current) call.fetch();
    },
    { immediate: true },
  );
  return {
    rows: computed(() => (toValue(name) ? (call.data ?? []) : [])),
    reload: () => call.reload(),
  };
}

/** The files attached to the record `name` of `doctype`. */
export function useAttachments(
  doctype: string,
  name: MaybeRefOrGetter<string>,
) {
  const list = useRecordList<FileAttachment>(name, (current) => ({
    doctype: "File",
    fields: JSON.stringify(["name", "file_name", "file_url", "file_size"]),
    filters: JSON.stringify([
      ["attached_to_doctype", "=", doctype],
      ["attached_to_name", "=", current],
    ]),
    limit_page_length: ATTACHMENT_LIMIT,
  }));
  return { files: list.rows, reload: list.reload };
}

interface FollowRow {
  user: string;
  full_name: string | null;
  user_image: string | null;
}

/**
 * The users following the record `name` of `doctype` (Frappe's `Document Follow`). The
 * backend lists only the viewer's own follow unless they're a System Manager.
 */
export function useFollowers(doctype: string, name: MaybeRefOrGetter<string>) {
  const list = useRecordList<FollowRow>(name, (current) => ({
    doctype: "Document Follow",
    fields: JSON.stringify([
      "user",
      "user.full_name as full_name",
      "user.user_image as user_image",
    ]),
    filters: JSON.stringify([
      ["ref_doctype", "=", doctype],
      ["ref_docname", "=", current],
    ]),
    limit_page_length: FOLLOWER_LIMIT,
  }));
  return {
    followers: computed<Person[]>(() =>
      list.rows.value.map((row) => ({
        userId: row.user,
        label: row.full_name || row.user,
        image: row.user_image ?? undefined,
      })),
    ),
    reload: list.reload,
  };
}
