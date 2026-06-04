import type { PropsWithChildren } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import {
  DEFAULT_TRACKING,
  TrackingContext,
  type Response,
  type TrackingContextProps,
} from "./context";

interface TrackingProviderProps extends PropsWithChildren {
  projectId: string;
}

export function TrackingProvider({
  projectId,
  children,
}: TrackingProviderProps) {
  const { data } = useFrappeGetCall<Response>(
    "next_pms.next_projects.api.project.get_project_sidebar",
    { project: projectId },
  );

  const value: TrackingContextProps = {
    tracking: data?.message ?? DEFAULT_TRACKING,
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}
