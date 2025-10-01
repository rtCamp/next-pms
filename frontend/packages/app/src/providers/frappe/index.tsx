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
import { envs } from "@/lib/envs";
const FrappeProvider = ({ children }: { children: ReactNode }) => {
	return (
		<_FrappeProvider
			url={envs.SITE.URL}
			socketPort={envs.SOCKET.PORT}
			enableSocket={enableSocket()}
			siteName={getSiteName()}
		>
			<VersionUpdate>{children}</VersionUpdate>
		</_FrappeProvider>
	);
};

export default FrappeProvider;
