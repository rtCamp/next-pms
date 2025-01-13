/**
 * External dependencies.
 */
import { useContext } from "react";
import { FrappeConfig, FrappeContext } from "frappe-react-sdk";
import useSWR, { SWRConfiguration } from "swr";

/**
 * Internal dependencies.
 */
import { encodeQueryData } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFrappeDocTypeCount = (
  doctype: string,
  params?: Record<string, any>,
  swrKey?: string,
  options?: SWRConfiguration,
) => {
  const method = "frappe.desk.reportview.get_count";
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const urlParams = encodeQueryData(params ?? {});

  const url = `${method}?${urlParams}`;

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
