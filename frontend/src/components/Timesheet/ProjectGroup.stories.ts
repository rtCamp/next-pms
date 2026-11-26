import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import ProjectGroup from "./ProjectGroup.vue";
import TaskWeekRow from "./TaskWeekRow.vue";
import {
  DOCS_TASK,
  RESPONSIVENESS_TASK,
  WEEK_DATES,
} from "./WeekGroup.fixtures";

const TASKS = {
  [RESPONSIVENESS_TASK.name]: RESPONSIVENESS_TASK,
  [DOCS_TASK.name]: DOCS_TASK,
};

const meta = {
  title: "Components/Timesheet/ProjectGroup",
  component: ProjectGroup,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Blue Harbour CMS Migration",
    dates: WEEK_DATES,
    tasks: TASKS,
    onCellClick: fn(),
  },
  render: (args) => ({
    components: { ProjectGroup, TaskWeekRow },
    setup: () => ({
      args,
      responsiveness: RESPONSIVENESS_TASK,
      docs: DOCS_TASK,
    }),
    template: `
      <ProjectGroup v-bind="args">
        <TaskWeekRow class="pl-7.5" :dates="args.dates" :task="responsiveness" />
        <TaskWeekRow class="pl-7.5" :dates="args.dates" :task="docs" />
      </ProjectGroup>
    `,
  }),
} satisfies Meta<typeof ProjectGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Collapsed: Story = { args: { defaultCollapsed: true } };

export const ApprovedDaysOpen: Story = {
  args: { lockApproved: false, highlightTimeEntries: true },
};

export const HiddenTime: Story = { args: { hideTime: true } };

export const Disabled: Story = { args: { disabled: true } };
