import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import SortSelector from "./SortSelector.vue";
import type { SortField } from "./types";

const CURRENCY_TOOLTIP = "Select a currency to enable this sort";

const FIELDS: SortField[] = [
  { field: "project_name", label: "Project name" },
  { field: "custom_project_phase", label: "Phase" },
  {
    field: "burn_rate_per_week",
    label: "Burn rate/week",
    disabled: true,
    tooltipText: CURRENCY_TOOLTIP,
  },
  { field: "cost_burn_percent", label: "Cost burn" },
  { field: "expected_start_date", label: "Start date" },
  { field: "expected_end_date", label: "End date" },
];

const meta = {
  title: "Components/SortSelector",
  component: SortSelector,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    fields: FIELDS,
    modelValue: null,
    "onUpdate:modelValue": fn(),
  },
  render: (args) => ({
    components: { SortSelector },
    setup: () => ({ args, value: ref(args.modelValue ?? null) }),
    template: `<SortSelector v-bind="args" v-model="value" />`,
  }),
} satisfies Meta<typeof SortSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const trigger = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("button", { name: /^Sort/ });
const option = (label: string) =>
  screen.getByRole("button", { name: new RegExp(`^${label}`) });

export const Unsorted: Story = {};

export const Sorted: Story = {
  args: { modelValue: { field: "custom_project_phase", order: "asc" } },
};

export const Open: Story = {
  args: { modelValue: { field: "project_name", order: "desc" } },
  play: async ({ canvasElement }) => {
    await userEvent.click(trigger(canvasElement));
    await screen.findByRole("button", { name: "Clear sort" });
  },
};

export const NewFieldStartsDescending: Story = {
  tags: ["interaction"],
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
  tags: ["interaction"],
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

    await userEvent.click(option("Start date"));
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith({
        field: "expected_start_date",
        order: "desc",
      }),
    );
    await expect(option("Project name")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  },
};

export const DisabledFieldIgnoresClick: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    await userEvent.click(trigger(canvasElement));
    const disabled = await screen.findByRole("button", {
      name: /^Burn rate\/week/,
    });
    await expect(disabled).toHaveAttribute("aria-disabled", "true");

    await userEvent.hover(disabled);
    await expect(
      await screen.findByRole("tooltip", {}, { timeout: 2000 }),
    ).toHaveTextContent(CURRENCY_TOOLTIP);

    await userEvent.click(disabled);
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();
  },
};

export const ClearSort: Story = {
  tags: ["interaction"],
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
