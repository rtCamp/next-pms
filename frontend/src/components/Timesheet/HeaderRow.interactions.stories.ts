import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import HeaderRow from "./HeaderRow.vue";
import visual, { WithHelp } from "./HeaderRow.stories";

const meta = {
  ...visual,
  title: "Components/Timesheet/HeaderRow/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof HeaderRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShowsDaysAndTotal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      await expect(canvas.getByText(day)).toBeVisible();
    }
    await expect(canvas.getByText("Total")).toBeVisible();
  },
};

export const LevelsAreText: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const level of ["Week", "Project", "Task"]) {
      await expect(canvas.getByText(level)).toBeVisible();
    }
    await expect(canvas.queryByRole("button")).toBeNull();
    await expect(canvas.queryByRole("navigation")).toBeNull();
  },
};

export const HelpCardsBesideLevelsAndTotal: Story = {
  args: WithHelp.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "About Day cells" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "About Total" }),
    ).toBeVisible();
  },
};
