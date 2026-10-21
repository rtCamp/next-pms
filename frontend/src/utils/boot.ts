/**
 * Whether the optional Project field `fieldname` exists on this site. Some fields the
 * Project details page shows come from other apps; a write to a missing one is
 * silently dropped, so their editors only show when the field exists.
 */
export function hasProjectField(fieldname: string): boolean {
  return window.boot?.optional_project_fields?.[fieldname] ?? false;
}
