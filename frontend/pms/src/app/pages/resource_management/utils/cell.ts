const getCellBackGroundColor = (allocationPercentage: number) => {
  if (allocationPercentage === -1) {
    return "bg-gray-200";
  }

  if (allocationPercentage >= 100 || allocationPercentage < 0) {
    return "bg-destructive/30";
  }

  if (allocationPercentage <= 10) {
    return "bg-success/20";
  }

  if (allocationPercentage <= 20) {
    return "bg-customYellow";
  }

  return "bg-destructive/10";
};

export { getCellBackGroundColor };
