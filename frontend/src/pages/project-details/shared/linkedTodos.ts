/**
 * The confirmation for deleting a record ToDos may be linked to, e.g. `label`
 * "milestone": the ToDos stay, so it says so when there are any.
 */
export function deleteRecordMessage(
  label: string,
  title: string,
  hasTodos: boolean,
): string {
  return `Are you sure you want to delete the ${label.toLowerCase()} "${title}"?${
    hasTodos ? " Its linked ToDos will not be deleted." : ""
  } This action cannot be undone.`;
}
