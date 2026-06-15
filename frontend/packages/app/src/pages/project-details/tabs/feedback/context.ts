import { createContext, useContextSelector } from "use-context-selector";
import { MonthYear } from "./types";

export interface FeedbackContextProps {
  selectedClientFeedbackId: string | null;
  handleClientFeedbackIdChange: (id: string | null) => void;
  selectedClientMonth: MonthYear;
  handleSelectedMonthChange: (monthYear: MonthYear) => void;
  clientTimelineStartDate: Date;
  setClientTimelineStartDate: React.Dispatch<React.SetStateAction<Date>>;
  clientTimelineEndDate: Date;
  setClientTimelineEndDate: React.Dispatch<React.SetStateAction<Date>>;
}

export const FeedbackContext = createContext<FeedbackContextProps>({
  selectedClientFeedbackId: null,
  handleClientFeedbackIdChange: () => {},
  selectedClientMonth: { month: 0, year: 0 },
  handleSelectedMonthChange: () => {},
  clientTimelineStartDate: new Date(),
  setClientTimelineStartDate: () => {},
  clientTimelineEndDate: new Date(),
  setClientTimelineEndDate: () => {},
});

export const useFeedbackContext = <T>(
  selector: (state: FeedbackContextProps) => T,
) => useContextSelector(FeedbackContext, selector);
