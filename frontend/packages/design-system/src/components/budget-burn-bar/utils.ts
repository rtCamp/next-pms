export const scale = (v: number, maxValue: number) => {
  if (maxValue <= 0) {
    return 0;
  } else if (v > maxValue) {
    return 100;
  } else {
    return (v / maxValue) * 100;
  }
};
