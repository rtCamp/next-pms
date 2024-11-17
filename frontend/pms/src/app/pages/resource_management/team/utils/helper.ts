const getTableCellClass = (index: number, weekIndex: number = 0) => {
  //   return "flex max-w-20 w-full justify-center items-center border-r border-b border-gray-400";
  if (index == 4 && weekIndex == 0) {
    return "text-xs flex py-3 max-w-20 w-full justify-center items-center border-r border-gray-300";
  }
  return "text-xs flex py-3 max-w-20 w-full justify-center items-center";
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
