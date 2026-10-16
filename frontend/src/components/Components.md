# Components

Components frappe-ui lacks. Build from frappe-ui first and add one here only for a real gap (P1).

## Folder layout

One folder per component, named after it:

```
MonthPicker/
  MonthPicker.vue                        the component
  MonthPicker.stories.ts                 visual stories (P5)
  MonthPicker.interactions.stories.ts    stories with play functions, run as tests (P5)
  MonthPicker.fixtures.ts                sample data both story files share, when needed
  types.ts                               props, emits and other public types
  index.ts                               public exports: the component, `export type * from "./types"`, plus any constants
```

A folder may also hold sub-components (`FilterRow.vue`, `CommentItem.vue`), `constants.ts`, `utils.ts` or
`icons.ts`. Import components through the folder's `index.ts`, never from the `.vue` file directly. Helpers shared
across components live in `src/utils/`.

## Catalogue

| Folder | Exports |
|---|---|
| `AddTime/` | `AddTime` (the Add time dialog's form: entry, validation, calendar events into the comment), `AddTimeDialog` (loads lookups, hours left and calendar events, and saves) |
| `ApprovalStatus/` | `ApprovalStatus`, `APPROVAL_STATUSES`, `APPROVAL_STATUS_ICONS` |
| `BudgetBurnBar/` | `BudgetBurnBar`, `budgetBurnTier` |
| `CalendarTimeline/` | `CalendarTimeline`, `EventChip`, `DEFAULT_VISIBLE_DAYS`, date helpers re-exported from `utils/date` |
| `ColumnSelector/` | `ColumnSelector` |
| `Comments/` | `Comments` |
| `DayChip/` | `DayChip` |
| `DurationInput/` | `DurationInput` |
| `ErrorFallback/` | `ErrorFallback` |
| `Filter/` | `Filter`, `FilterLinkValue` (the `#link-value` input: searches the field's doctype or `customMethod`), `DEFAULT_OPERATORS` |
| `LoadingOverlay/` | `LoadingOverlay` |
| `MonthPicker/` | `MonthPicker` |
| `NotificationTray/` | `NotificationTray` |
| `ProgressBar/` | `ProgressBar` |
| `RichText/` | `RichText` (read-only editor HTML, e.g. comments) |
| `SortSelector/` | `SortSelector` |
| `TaskBadges/` | `TaskBadges` (a task's due date and project) |
| `TaskLog/` | `TaskLog` (view), `TaskLogDialog` (loads its data), `useTaskLog`, `TASK_LOG_RANGES`, `DEFAULT_TASK_LOG_RANGE` |
| `TaskProgress/` | `TaskProgress` |
| `TaskStatus/` | `TaskStatus`, `TASK_STATUSES`, `TASK_STATUS_ICONS` |
| `Timesheet/` | Timesheet rows: `HeaderRow`, `WeekRow`, `MemberRow`, `ProjectRow`, `TaskRow`, `TimeOffRow`, `TotalRow`; rows that derive their hours from timesheet data: `WeekGroup`, `MemberGroup`, `ProjectGroup` (collapsible, rows below in the slot), `TaskWeekRow`, `TimeOffWeekRow`; `LoadMoreRow` (paging skeleton and sentinel); the derivation in `utils.ts` (`computeWeekTotals`, `computeTaskCells`, …); `TaskCard` (a task's hover card), `APPROVAL_STATUS_BADGE`, `SUBMIT_ACTION_LABEL`, `totalHoursClass`; approval and task status helpers (`APPROVAL_STATUS_PARAMS`, `approvalStatusFromParam`, `canSubmitForApproval`, `toApprovalStatus`, `NO_APPROVAL_STATUS`, `toTaskStatus`, `TOTAL_HOURS_THEME`) and the timesheet data types |
| `UnsavedChangesDialog/` | `UnsavedChangesDialog` (the Save Changes prompt for `provideUnsavedChanges` in `composables/useUnsavedChanges.ts`) |

Look up props and usage with the Storybook MCP (`docs-list` / `docs-show`), not from this table. Keep the table in
sync when adding, renaming or removing a component.

## Adding a component

- Port from the React frontend (design-system or frappe-ui-react) with the `port-frappe-ui-react-component` skill.
- Ship stories with the component; cover its behaviour with interaction stories (P5).
- Done when `npm run lint`, `npm run type-check` and `npm run test-storybook -- --run` pass.
