/**
 * External dependencies.
 */
import { ReactNode } from "react";
import { useFrappeVersionUpdate } from "@next-pms/hooks";
import { useToasts } from "@rtcamp/frappe-ui-react";

export const VersionUpdate = ({ children }: { children: ReactNode }) => {
  const toast = useToasts();
  useFrappeVersionUpdate(() => {
    toast.info(
      "New version available. Please refresh the page to get the latest version.",
      {
        duration: 10000,
      },
    );
  });
  return <>{children}</>;
};
