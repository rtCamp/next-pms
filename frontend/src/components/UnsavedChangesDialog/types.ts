export interface UnsavedChangesDialogProps {
  /** Whether the dialog is open (v-model:open). Closing it means keep editing. */
  open?: boolean;
}

export interface UnsavedChangesDialogEmits {
  "update:open": [open: boolean];
  /** Discard Changes was pressed. */
  discard: [];
  /** Keep Editing was pressed, or the dialog was dismissed. */
  keepEditing: [];
  /** Save Changes was pressed. */
  save: [];
}
