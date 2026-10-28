import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import InfoHoverCard from "./InfoHoverCard.vue";
import { FULL_HELP, TOOLTIP } from "./InfoHoverCard.fixtures";

const meta = {
  title: "Components/InfoHoverCard/Interactions",
  component: InfoHoverCard,
  tags: ["interaction"],
  args: { help: FULL_HELP },
  render: (args) => ({
    components: { InfoHoverCard },
    setup: () => ({ args }),
    template: `<div class="p-4"><InfoHoverCard v-bind="args" /></div>`,
  }),
} satisfies Meta<typeof InfoHoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpensOnHover: Story = {
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", {
      name: "About Cost burn",
    });
    await userEvent.hover(trigger);
    await waitFor(() =>
      expect(
        screen.getByText("Cost burn = actual cost ÷ target cost"),
      ).toBeVisible(),
    );
    expect(screen.getByText("Used so far")).toBeVisible();
    expect(
      screen.getByText("The forecast comes from the remaining allocations."),
    ).toBeVisible();
    await userEvent.unhover(trigger);
    await userEvent.hover(canvasElement);
    await waitFor(() =>
      expect(screen.queryByText("Used so far")).not.toBeInTheDocument(),
    );
  },
};

export const OpensOnFocus: Story = {
  play: async () => {
    await userEvent.tab();
    await waitFor(() =>
      expect(
        screen.getByText(
          "How much of the target cost is used so far, and how much is forecast.",
        ),
      ).toBeVisible(),
    );
  },
};

export const ShowsTheTooltip: Story = {
  args: { help: undefined, tooltip: TOOLTIP },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", {
      name: TOOLTIP,
    });
    await userEvent.hover(trigger);
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent(TOOLTIP),
    );
  },
};
