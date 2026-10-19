/** First word of the employee's name, else of the user's name, else `"there"`. */
export function firstName(employeeName: string, userName: string): string {
  return (employeeName || userName).trim().split(" ")[0] || "there";
}
