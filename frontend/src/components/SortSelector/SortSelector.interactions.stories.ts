import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import SortSelector from "./SortSelector.vue";
import type { SortState } from "./types";
import { CURRENCY_TOOLTIP, FIELDS } from "./SortSelector.fixtures";

const meta = {
  title: "Components/SortSelector/Interactions",
  component: SortSelector,
  tags: ["interaction"],
  args: {
    fields: FIELDS,
    modelValue: null,
    "onUpdate:modelValue": fn(),
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { SortSelector },
      setup: () => ({
        args,
        update: (modelValue: SortState | null) => {
          // `updateArgs` syncs Controls; story tests only see the args write.
          Object.assign(args, { modelValue });
          updateArgs({ modelValue });
        },
      }),
      template: `<SortSelector v-bind="args" @update:model-value="update" />`,
    };
  },
} satisfies Meta<typeof SortSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const trigger = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("button", { name: /^Sort/ });
const option = (label: string) =>
  screen.getByRole("button", { name: new RegExp(`^${label}`) });

export const Open: Story = {
  args: { modelValue: { field: "project_name", order: "desc" } },
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    await screen.findByRole("button", { name: "Clear sort" });
  },
};

export const NewFieldStartsDescending: Story = {
  play: async ({ canvasElement, args }) => {
    await expect(trigger(canvasElement)).toHaveTextContent(/^\s*Sort\s*$/);
    await userEvent.click(trigger(canvasElement));
    await screen.findByRole("button", { name: /^Phase/ });
    await expect(
      screen.queryByRole("button", { name: "Clear sort" }),
    ).toBeNull();

    await userEvent.click(option("Phase"));
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith({
        field: "custom_project_phase",
        order: "desc",
      }),
    );
    await waitFor(() =>
      expect(option("Phase")).toHaveAttribute("aria-pressed", "true"),
    );
    await expect(option("Phase")).toHaveAccessibleName(/descending/);
    await expect(trigger(canvasElement)).toHaveTextContent("Phase");
  },
};

export const ToggleOrder: Story = {
  args: { modelValue: { field: "project_name", order: "desc" } },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(trigger(canvasElement));
    await screen.findByRole("button", { name: /^Project name/ });

    await userEvent.click(option("Project name"));
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith({
        field: "project_name",
        order: "asc",
      }),
    );
    await waitFor(() =>
      expect(option("Project name")).toHaveAccessibleName(/ascending/),
    );

    await userEvent.click(option("Project name"));
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith({
        field: "project_name",
        order: "desc",
      }),
    );
  },
};

export const OtherFieldReplacesSort: Story = {
  args: { modelValue: { field: "project_name", order: "asc" } },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(trigger(canvasElement));
    await screen.findByRole("button", { name: /^Start date/ });

    await userEvent.click(option("Start date"));
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith({
        field: "expected_start_date",
        order: "desc",
      }),
    );
    await waitFor(() =>
      expect(option("Project name")).toHaveAttribute("aria-pressed", "false"),
    );
  },
};

export const DisabledFieldIgnoresClick: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(trigger(canvasElement));
    const disabled = await screen.findByRole("button", {
      name: /^Burn rate\/week/,
    });
    await expect(disabled).toBeDisabled();

    await userEvent.hover(disabled);
    await expect(
      await screen.findByRole("tooltip", {}, { timeout: 2000 }),
    ).toHaveTextContent(CURRENCY_TOOLTIP);

    await userEvent.click(disabled, { pointerEventsCheck: 0 });
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();
  },
};

export const ClearSort: Story = {
  args: { modelValue: { field: "cost_burn_percent", order: "asc" } },
  play: async ({ canvasElement, args }) => {
    await expect(trigger(canvasElement)).toHaveTextContent("Cost burn");
    await userEvent.click(trigger(canvasElement));
    await userEvent.click(
      await screen.findByRole("button", { name: "Clear sort" }),
    );
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith(null),
    );
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Clear sort" })).toBeNull(),
    );
    await expect(trigger(canvasElement)).not.toHaveTextContent("Cost burn");
    await expect(trigger(canvasElement)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  },
};
