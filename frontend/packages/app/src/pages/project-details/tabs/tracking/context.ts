import { createContext, useContextSelector } from "use-context-selector";

export type Response = {
  message: {
    burn: {
      total_budget: number;
      cost_accrued: number;
      cost_forecasted: number;
    };
    progress: {
      actual_time: number;
      total_hours_purchased: number;
    };
  };
};

export type Tracking = Response["message"];

export interface TrackingContextProps {
  tracking: Tracking;
}

export const DEFAULT_TRACKING: Tracking = {
  burn: { total_budget: 0, cost_accrued: 0, cost_forecasted: 0 },
  progress: { actual_time: 0, total_hours_purchased: 0 },
};

export const TrackingContext = createContext<TrackingContextProps>({
  tracking: DEFAULT_TRACKING,
});

export const useTracking = <T>(selector: (state: TrackingContextProps) => T) =>
  useContextSelector(TrackingContext, selector);
