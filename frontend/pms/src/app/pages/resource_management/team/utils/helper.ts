import { store } from "@/store";

const getTableCellClass = (index: number, weekIndex: number = 0) => {
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

export { getTableCellClass, getTableCellRow, getInitials };
