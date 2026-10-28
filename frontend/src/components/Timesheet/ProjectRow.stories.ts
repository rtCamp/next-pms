import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import ProjectRow from "./ProjectRow.vue";
import { PROJECT_WEEK } from "./ProjectRow.fixtures";

const meta = {
  title: "Components/Timesheet/ProjectRow",
  component: ProjectRow,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    label: "Atlas UI Stabilization",
    collapsed: false,
    totalHours: "22:30",
    totalHoursTheme: "green",
    timeEntries: PROJECT_WEEK,
    onCellClick: fn(),
  },
  argTypes: {
    totalHoursTheme: {
      control: "select",
      options: ["green", "red", "amber", "gray"],
    },
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { ProjectRow },
      setup: () => ({
        args,
        update: (collapsed: boolean) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { collapsed });
          updateArgs({ collapsed });
        },
      }),
      template: `<ProjectRow v-bind="args" @update:collapsed="update" />`,
    };
  },
} satisfies Meta<typeof ProjectRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Highlighted: Story = { args: { highlightTimeEntries: true } };

export const Collapsed: Story = { args: { collapsed: true } };

export const CustomPrefix: Story = {
  render: (args) => ({
    components: { ProjectRow },
    setup: () => ({ args }),
    template: `
      <ProjectRow v-bind="args">
        <template #prefix>
          <span class="lucide-briefcase size-4" aria-hidden="true" />
        </template>
      </ProjectRow>
    `,
  }),
};
