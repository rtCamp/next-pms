// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const encodeQueryData = (data: Record<string, any>): string => {
  const ret: string[] = [];
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      ret.push(
        encodeURIComponent(key) + "=" + encodeURIComponent(String(data[key])),
      );
    }
  }
  return ret.join("&");
};
