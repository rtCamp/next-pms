/**
 * External dependencies.
 */
import { useContext } from "react";
import { FrappeConfig, FrappeContext } from "frappe-react-sdk";
import useSWR, { SWRConfiguration } from "swr";


/**
 *  Hook to fetch the count of a doctype.
 *
 * @param doctype - name of the doctype
 * @param params [Optional] - additional parameters for the request
 * @param swrKey [Optional] - key for the cache
 * @param options [Optional] - SWRConfiguration options for fetching data
 * @returns an object with the following properties: data, error, and isValidating
 */
export const useGetFrappeDocTypeCount = (
    doctype: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: Record<string, any>,
    swrKey?: string,
    options?: SWRConfiguration,
) => {
    const method = "frappe.desk.reportview.get_count";
    const { call } = useContext(FrappeContext) as FrappeConfig;

    const url = `${method}`;

    const requestParams = {
        doctype: doctype,
        ...params,
    };
    const fetcher = async () => {
        const res = await call.post(method, requestParams);
        return res.message;
    };
    const swrResult = useSWR(
        swrKey === undefined ? url : swrKey,
        fetcher,
        options,
    );
    return {
        ...swrResult,
    };
};