import { useMemo, type PropsWithChildren } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import {
  DEFAULT_TRACKING,
  TrackingContext,
  type Response,
  type Tracking,
  type TrackingContextProps,
} from "./context";
import { useProjectDetail } from "../../context";

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
  const project = useProjectDetail((state) => state.project);

  const tracking = useMemo<Tracking>(() => {
    const message = data?.message;
    return {
      burn: message?.burn ?? DEFAULT_TRACKING.burn,
      progress: message?.progress ?? DEFAULT_TRACKING.progress,
      company: project?.company ?? "",
      currency: project?.custom_currency ?? "INR",
      projectProfit: project?.custom_estimated_profit ?? 0,
      projectedProfitMargin: project?.custom_percentage_estimated_profit ?? 0,
    };
  }, [data, project]);

  const value: TrackingContextProps = { tracking };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}
