/** The note editor's routes, children of `project-details`. */
export const NOTE_EDITOR_ROUTES = {
  new: "project-note-new",
  edit: "project-note-edit",
  template: "project-note-template-edit",
} as const;

export const NOTES_API =
  "/api/v2/method/next_pms.timesheet.api.project_status_update";

export const GET_LIST_URL = "/api/v2/method/frappe.client.get_list";

export const NOTE_DOCTYPE = "Project Status Update";
export const TEMPLATE_DOCTYPE = "Project Status Update Template";
export const CATEGORY_DOCTYPE = "Project Status Update Template Category";

/** The open note on the Notes tab: absent for the list. */
export const NOTE_PARAM = "note";
/** The template a new note starts from. */
export const TEMPLATE_PARAM = "template";
/** `?mode=template` makes the new-note route write a template. */
export const EDITOR_MODE_PARAM = "mode";
export const TEMPLATE_EDITOR_MODE = "template";

/** The only status the tab lists and the editor saves. */
export const PUBLISH_STATUS = "Publish";

export const NOTE_LIST_LIMIT = 500;
export const TEMPLATE_PICKER_LIMIT = 20;
export const SEARCH_DEBOUNCE_MS = 400;
/** The pause after a task toggle in a note before its body is saved. */
export const TASK_SAVE_DELAY_MS = 300;
export const TEMPLATE_DESCRIPTION_MAX_LENGTH = 140;
