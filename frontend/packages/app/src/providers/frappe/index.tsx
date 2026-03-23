/**
 * External dependencies.
 */
import { ReactNode } from "react";

import { FrappeProvider as _FrappeProvider } from "frappe-react-sdk";
/**
 * Internal dependencies.
 */
import { VersionUpdate } from "@/components/versionUpdate";
import { enableSocket } from "@/lib/utils";
import { useBoot } from "../boot/hook";

const FrappeProvider = ({ children }: { children: ReactNode }) => {
  const { sitename } = useBoot();
  return (
    <_FrappeProvider
      url={import.meta.env.VITE_BASE_URL ?? ""}
      socketPort={import.meta.env.VITE_SOCKET_PORT}
      enableSocket={enableSocket()}
      siteName={sitename}
    >
      <VersionUpdate>{children}</VersionUpdate>
    </_FrappeProvider>
  );
};

export default FrappeProvider;
