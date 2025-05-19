/**
 * External dependencies.
 */
import { ReactNode } from "react";

import { FrappeProvider as _FrappeProvider } from "frappe-react-sdk";
/**
 * Internal dependencies.
 */
import { getSiteName, enableSocket } from "@/lib/utils";
import { VersionUpdate } from "../../app/components/versionUpdate";
const FrappeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <_FrappeProvider
      url={import.meta.env.VITE_BASE_URL ?? ""}
      socketPort={import.meta.env.VITE_SOCKET_PORT}
      enableSocket={enableSocket()}
      siteName={getSiteName()}
    >
      <VersionUpdate>{children}</VersionUpdate>
    </_FrappeProvider>
  );
};

export default FrappeProvider;
