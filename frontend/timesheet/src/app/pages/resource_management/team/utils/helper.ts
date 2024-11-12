const getTableCellClass = (index: number, weekIndex: number = 0) => {
//   return "flex max-w-20 w-full justify-center items-center border-r border-b border-gray-400";
  if (index == 4 && weekIndex == 0) {
    return "flex max-w-20 w-full justify-center items-center border-r border-gray-300";
  }
  return "flex max-w-20 w-full justify-center items-center";
};

export { getTableCellClass };
