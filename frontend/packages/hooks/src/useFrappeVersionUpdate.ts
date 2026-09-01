import { useFrappeEventListener } from "frappe-react-sdk";
export const useFrappeVersionUpdate = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: (data: any) => void,
) => {
  useFrappeEventListener("version-update", (data) => {
    callback(data);
  });
};
