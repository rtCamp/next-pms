import type { PropsWithChildren } from "react";
import { useCallback, useState } from "react";
import { addYears, getMonth, getYear, startOfToday } from "date-fns";
import { FeedbackContext } from "./context";
import { MonthYear } from "./types";

export function FeedbackProvider({ children }: PropsWithChildren) {
  const [clientTimelineStartDate, setClientTimelineStartDate] = useState<Date>(
    addYears(startOfToday(), -5),
  );
  const [clientTimelineEndDate, setClientTimelineEndDate] = useState<Date>(
    addYears(startOfToday(), 5),
  );

  const [selectedClientMonth, setSelectedClientMonth] = useState<MonthYear>({
    month: getMonth(new Date()),
    year: getYear(new Date()),
  });
  const [selectedClientFeedbackId, setSelectedClientFeedbackId] = useState<
    string | null
  >(null);

  const handleSelectedMonthChange = useCallback((monthYear: MonthYear) => {
    setSelectedClientMonth(monthYear);
  }, []);

  const handleClientFeedbackIdChange = useCallback((id: string | null) => {
    setSelectedClientFeedbackId(id);
  }, []);

  const value = {
    selectedClientFeedbackId,
    handleClientFeedbackIdChange,
    selectedClientMonth,
    handleSelectedMonthChange,
    clientTimelineStartDate,
    setClientTimelineStartDate,
    clientTimelineEndDate,
    setClientTimelineEndDate,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}
