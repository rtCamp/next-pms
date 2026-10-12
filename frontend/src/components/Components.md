# Components

Components frappe-ui lacks. Build from frappe-ui first and add one here only for a real gap (P1).

## Folder layout

One folder per component, named after it:

```
MonthPicker/
  MonthPicker.vue          the component
  MonthPicker.stories.ts   stories and interaction tests (P5)
  types.ts                 props, emits and other public types
  index.ts                 public exports: the component, `export type * from "./types"`, plus any constants
```

A folder may also hold sub-components (`FilterRow.vue`, `CommentItem.vue`), `constants.ts`, `utils.ts` or
`icons.ts`. Import components through the folder's `index.ts`, never from the `.vue` file directly. Helpers shared
across components live in `src/utils/`.

## Catalogue

| Folder | Exports |
|---|---|
| `ApprovalStatus/` | `ApprovalStatus`, `APPROVAL_STATUSES`, `APPROVAL_STATUS_ICONS` |
| `BudgetBurnBar/` | `BudgetBurnBar`, `budgetBurnTier` |
| `CalendarTimeline/` | `CalendarTimeline`, `EventChip`, `DEFAULT_VISIBLE_DAYS`, date helpers re-exported from `utils/date` |
| `Card/` | `Card` |
| `CircularProgressBar/` | `CircularProgressBar` |
| `ColumnSelector/` | `ColumnSelector` |
| `Comments/` | `Comments` |
| `DayChip/` | `DayChip` |
| `DurationInput/` | `DurationInput` |
| `ErrorFallback/` | `ErrorFallback` |
| `Filter/` | `Filter`, `DEFAULT_OPERATORS` |
| `LoadingOverlay/` | `LoadingOverlay` |
| `MonthPicker/` | `MonthPicker` |
| `NotificationTray/` | `NotificationTray` |
| `ProgressBar/` | `ProgressBar` |
| `SortSelector/` | `SortSelector` |
| `TaskProgress/` | `TaskProgress` |
| `TaskStatus/` | `TaskStatus`, `TASK_STATUSES`, `TASK_STATUS_ICONS` |
| `Timesheet/` | Timesheet rows: `HeaderRow`, `WeekRow`, `MemberRow`, `ProjectRow`, `TaskRow`, `TimeOffRow`, `TotalRow` |

Look up props and usage with the Storybook MCP (`docs-list` / `docs-show`), not from this table. Keep the table in
sync when adding, renaming or removing a component.

## Adding a component

- Port from frappe-ui-react with the `port-frappe-ui-react-component` skill.
- Ship stories with the component; cover its behaviour with interaction stories (P5).
- Done when `npm run type-check` and `npm run test-storybook -- --run` pass.
