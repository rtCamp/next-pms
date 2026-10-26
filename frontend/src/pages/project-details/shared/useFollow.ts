import { toast, useCall } from "frappe-ui";
import { errorMessage, isAbortError } from "@/utils/errors";
import { UPDATE_FOLLOW_URL } from "./constants";

/**
 * Follows and unfollows documents of `doctype` with Frappe's document follow, toasting
 * the outcome as React did.
 */
export function useFollow(doctype: string) {
  const call = useCall<
    unknown,
    { doctype: string; doc_name: string; following: boolean }
  >({ url: UPDATE_FOLLOW_URL, method: "POST", immediate: false });

  /** Follows `name`, or unfollows it when `following`; resolves `true` once changed. */
  async function toggleFollow(
    name: string,
    following: boolean,
  ): Promise<boolean> {
    let result: unknown;
    try {
      result = await call.submit({
        doctype,
        doc_name: name,
        following: !following,
      });
    } catch (error) {
      if (!isAbortError(error)) toast.error(errorMessage(error));
      return false;
    }
    // Frappe answers a follow it didn't make (follow off for the user, …) with nothing.
    if (!following && !result) {
      toast.error("Document follow is not enabled for current user.");
      return false;
    }
    toast.success(following ? "Unfollowed document" : "Following document");
    return true;
  }

  return { toggleFollow };
}
