/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";
import { SWRConfiguration } from "swr";

/**
 *  Hook to fetch the doctype meta data from the server.
 *
 * @param doctype - name of the doctype
 * @param key [Optional] - key for the cache
 * @param options [Optional] - SWRConfiguration options for fetching data
 * @returns an object with the following properties: doc, childDocs, and isLoading
 */
export const useGetFrappeDoctypeMeta = (
  doctype: string,
  key?: string,
  options?: SWRConfiguration
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading } = useFrappeGetCall<{ docs: any[] }>(
    "frappe.desk.form.load.getdoctype",
    { doctype: doctype },
    key,
    options
  );

  const childDocs = data?.docs?.slice(1);

  return {
    doc: data?.docs?.[0],
    childDocs,
    isLoading,
  };
};
