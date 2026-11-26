import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import TaskLog from "./TaskLog.vue";
import { ASHA, DETAILS, ENTRIES } from "./TaskLog.fixtures";

const meta = {
  title: "Components/TaskLog",
  component: TaskLog,
  tags: ["autodocs"],
  args: {
    open: true,
    range: 15,
    view: "personal",
    details: { ...DETAILS, workedBy: [ASHA] },
    entries: ENTRIES.filter((entry) => entry.employee === ASHA),
    loading: false,
    "onUpdate:open": fn(),
    "onUpdate:range": fn(),
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { TaskLog },
      setup: () => ({
        args,
        update: (changed: { open?: boolean; range?: number }) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, changed);
          updateArgs(changed);
        },
      }),
      template: `
        <TaskLog
          v-bind="args"
          @update:open="update({ open: $event })"
          @update:range="update({ range: $event })"
        />
      `,
    };
  },
} satisfies Meta<typeof TaskLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Personal: Story = {};

export const Team: Story = {
  args: { view: "team", details: DETAILS, entries: ENTRIES },
};

export const WithGitHubLink: Story = {
  args: {
    details: {
      ...DETAILS,
      workedBy: [ASHA],
      ghLink: "https://github.com/rtCamp/next-pms/issues/1",
    },
  },
};

export const OverEstimate: Story = {
  args: { details: { ...DETAILS, actualHours: 15, workedBy: [ASHA] } },
};

export const Empty: Story = {
  args: { details: { ...DETAILS, workedBy: [] }, entries: [] },
};

export const Loading: Story = { args: { loading: true } };
