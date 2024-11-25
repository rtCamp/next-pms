import { store } from "@/store";
import { DateProps } from "@/store/team";

const getTableCellClass = (
  index: number,
  weekIndex: number = 0,
  isHeader: boolean = false
) => {
  //   return "flex max-w-20 w-full justify-center items-center border-r border-b border-gray-400";

  const state = store.getState();

  if (state && state.resource_team.tableView.view == "customer-view") {
    return "text-xs flex px-4 py-2 max-w-20 w-full justify-center items-center";
  }
  
  if (index == 4 && weekIndex == 0) {
    return "text-xs flex px-4 py-2 max-w-20 w-full justify-center items-center border-r border-gray-300";
  }
  return "text-xs flex px-4 py-2 max-w-20 w-full justify-center items-center";
};

const getTableCellRow = () => {
  return "flex items-center w-full";
};

const getInitials = (name: string) => {
  const words: string[] = name.split(" ");
  const initials = words.map((word) => word[0]).join("");
  return initials;
};

const daysDiff = (start: string | Date, end: string | Date) => {
  if (typeof start === "string") {
    start = new Date(start);
  }
  if (typeof end === "string") {
    end = new Date(end);
  }

  const diff = end.getTime() - start.getTime();

  if (diff == 0) {
    return 0;
  }

  let weekendDays: number = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) {
      weekendDays++;
    }
  }
  return Math.floor(diff / (1000 * 60 * 60 * 24)) - weekendDays;
};

const getRelativeStartDate = (start: string) => {
  const state = store.getState();
  const resourceTeamStateDates: DateProps[] = state.resource_team.data.dates;

  if (
    resourceTeamStateDates.length != 0 &&
    resourceTeamStateDates[0].start_date > start
  ) {
    return resourceTeamStateDates[0].start_date;
  }
  return start;
};

const getRelativeEndDate = (end: string): string => {
  const state = store.getState();
  const resourceTeamStateDates: DateProps[] = state.resource_team.data.dates;

  if (
    resourceTeamStateDates.length != 0 &&
    resourceTeamStateDates[resourceTeamStateDates.length - 1].end_date < end
  ) {
    return resourceTeamStateDates[resourceTeamStateDates.length - 1].end_date;
  }
  return end;
};

export {
  getTableCellClass,
  getTableCellRow,
  getInitials,
  daysDiff,
  getRelativeStartDate,
  getRelativeEndDate,
};
