import { useFrappeGetCall } from "frappe-react-sdk";

const useFrappeDoctypeMeta = (doctype: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading } = useFrappeGetCall<{ docs: any[] }>(
    "frappe.desk.form.load.getdoctype",
    {
      doctype: doctype,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  const childDocs = data?.docs?.slice(1);

  return {
    doc: data?.docs?.[0],
    childDocs,
    isLoading,
  };
};

export default useFrappeDoctypeMeta;
