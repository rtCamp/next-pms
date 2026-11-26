import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, ref } from "vue";
import { Combobox, TextInput } from "frappe-ui";
import { useArgs } from "storybook/preview-api";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import Filter from "./Filter.vue";
import type { FilterCondition, FilterField } from "./types";
import {
  FIELDS,
  LINK_RECORDS,
  MULTIPLE_CONDITIONS,
  PROJECT_CONDITION,
} from "./Filter.fixtures";

function useModelValue(
  args: { modelValue?: FilterCondition[] },
  updateArgs: ReturnType<typeof useArgs>[1],
) {
  const setValue = (modelValue: FilterCondition[]) => {
    // `updateArgs` syncs Controls; story tests only see the args write.
    Object.assign(args, { modelValue });
    updateArgs({ modelValue });
  };
  return { setValue };
}

function linkOptions(field: FilterField) {
  const link = field.link!;
  const labelField = link.labelField ?? "name";
  const valueField = link.valueField ?? "name";
  return (LINK_RECORDS[link.doctype] ?? []).map((r) => ({
    label: r[labelField] ?? r[valueField],
    value: r[valueField],
  }));
}

const meta = {
  title: "Components/Filter/Interactions",
  component: Filter,
  tags: ["interaction"],
  parameters: {
    a11y: {
      // frappe-ui's closed Combobox points aria-controls at a listbox reka-ui
      // hasn't rendered yet.
      options: { rules: { "aria-valid-attr-value": { enabled: false } } },
    },
  },
  args: {
    fields: FIELDS,
    "onUpdate:modelValue": fn(),
    "onUpdate:open": fn(),
    onClearAll: fn(),
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { Filter },
      setup: () => ({ args, ...useModelValue(args, updateArgs) }),
      template: `
        <div class="flex justify-center">
          <Filter v-bind="args" @update:model-value="setValue" />
        </div>
      `,
    };
  },
} satisfies Meta<typeof Filter>;

export default meta;
type Story = StoryObj<typeof meta>;

const trigger = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("button", { name: /^Filter/ });

async function pick(combobox: HTMLElement, option: string) {
  await userEvent.click(combobox);
  await userEvent.click(await screen.findByRole("option", { name: option }));
}

async function open(canvasElement: HTMLElement) {
  await userEvent.click(trigger(canvasElement));
  await screen.findByText("Where");
}

const lastEmitted = (spy: unknown) => {
  const calls = (spy as ReturnType<typeof fn>).mock.calls;
  return calls[calls.length - 1][0] as FilterCondition[];
};

const DUE_DATE_CONDITION: FilterCondition = {
  id: "1",
  field: "due_date",
  operator: "is",
  value: null,
};

const STATUS_CONDITION: FilterCondition = {
  id: "1",
  field: "status",
  operator: "is",
  value: "review",
};

/** Opening an empty filter adds a first row with no operator or value yet. */
export const OpenAddsEmptyCondition: Story = {
  play: async ({ canvasElement, args }) => {
    const button = trigger(canvasElement);
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(
      within(canvasElement).queryByRole("button", {
        name: "Clear all filters",
      }),
    ).toBeNull();

    await userEvent.click(button);
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-expanded", "true"),
    );
    await screen.findByText("Where");
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([
        expect.objectContaining({
          field: "project",
          operator: "",
          value: null,
        }),
      ]),
    );
    await expect(
      screen.getByRole("combobox", { name: "Value" }),
    ).toBeDisabled();
  },
};

/** Picking an operator and a value completes the condition and counts it. */
export const CompleteCondition: Story = {
  play: async ({ canvasElement, args }) => {
    await open(canvasElement);
    await pick(screen.getByRole("combobox", { name: "Operator" }), "is not");
    await pick(
      screen.getByRole("combobox", { name: "Value" }),
      "Backend Refactor",
    );
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([
        expect.objectContaining({
          field: "project",
          operator: "is_not",
          value: "backend",
        }),
      ]),
    );
    await expect(trigger(canvasElement)).toHaveTextContent("1");
    await expect(
      within(canvasElement).getByRole("button", { name: "Clear all filters" }),
    ).toBeInTheDocument();
  },
};

/** Switching to a text field resets the operator and value, and the value is typed. */
export const ChangeToTextField: Story = {
  args: { modelValue: [PROJECT_CONDITION] },
  play: async ({ canvasElement, args }) => {
    const spy = args["onUpdate:modelValue"];
    await open(canvasElement);
    const field = screen.getByRole("combobox", { name: "Field" });
    await waitFor(() => expect(field).toHaveValue("Project"));

    await pick(field, "Title");
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
        expect.objectContaining({ field: "title", operator: "=", value: null }),
      ]),
    );
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Operator" })).toHaveValue(
        "Equals",
      ),
    );
    const text = screen.getByRole("textbox", { name: "Value" });
    await expect(text).toHaveValue("");
    await userEvent.type(text, "Atlas");
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
        expect.objectContaining({ field: "title", value: "Atlas" }),
      ]),
    );
  },
};

/** A number field gets a numeric input and its first operator. */
export const ChangeToNumberField: Story = {
  args: { modelValue: [PROJECT_CONDITION] },
  play: async ({ canvasElement, args }) => {
    await open(canvasElement);
    await pick(
      screen.getByRole("combobox", { name: "Field" }),
      "Estimate (hours)",
    );
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([
        expect.objectContaining({
          field: "estimate",
          operator: ">",
          value: null,
        }),
      ]),
    );
    await expect(screen.getByRole("spinbutton", { name: "Value" })).toHaveValue(
      null,
    );
  },
};

/** A date field gets a date picker, and a typed date commits on Enter. */
export const ChangeToDateField: Story = {
  args: { modelValue: [PROJECT_CONDITION] },
  play: async ({ canvasElement, args }) => {
    const spy = args["onUpdate:modelValue"];
    await open(canvasElement);
    await pick(screen.getByRole("combobox", { name: "Field" }), "Due Date");
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
        expect.objectContaining({
          field: "due_date",
          operator: "is",
          value: null,
        }),
      ]),
    );
    await userEvent.type(
      screen.getByRole("combobox", { name: "Value" }),
      "2026-01-15{Enter}",
    );
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
        expect.objectContaining({ field: "due_date", value: "2026-01-15" }),
      ]),
    );
  },
};

/** An operator without a value clears and hides the value input. */
export const ValuelessOperator: Story = {
  args: { modelValue: [DUE_DATE_CONDITION] },
  play: async ({ canvasElement, args }) => {
    await open(canvasElement);
    await pick(screen.getByRole("combobox", { name: "Operator" }), "is empty");
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([
        expect.objectContaining({
          field: "due_date",
          operator: "is_empty",
          value: null,
        }),
      ]),
    );
    await waitFor(() =>
      expect(screen.queryByRole("combobox", { name: "Value" })).toBeNull(),
    );
  },
};

/** Changing to an operator of the same kind keeps the value. */
export const OperatorChangeKeepsValue: Story = {
  args: { modelValue: [STATUS_CONDITION] },
  play: async ({ canvasElement, args }) => {
    await open(canvasElement);
    await pick(screen.getByRole("combobox", { name: "Operator" }), "is not");
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([
        expect.objectContaining({
          field: "status",
          operator: "is_not",
          value: "review",
        }),
      ]),
    );
  },
};

/** "Add filter" adds an "And" row whose field can be changed on its own. */
export const AddRow: Story = {
  args: { modelValue: [PROJECT_CONDITION] },
  play: async ({ canvasElement, args }) => {
    const spy = args["onUpdate:modelValue"];
    await open(canvasElement);
    await userEvent.click(screen.getByRole("button", { name: "Add filter" }));
    await screen.findByText("And");
    await waitFor(() => expect(lastEmitted(spy)).toHaveLength(2));
    await expect(lastEmitted(spy)[1]).toMatchObject({
      field: "project",
      operator: "",
      value: null,
    });
    await expect(trigger(canvasElement)).toHaveTextContent("2");

    await pick(
      screen.getAllByRole("combobox", { name: "Field" })[1]!,
      "Priority",
    );
    await waitFor(() =>
      expect(lastEmitted(spy)[1]).toMatchObject({
        field: "priority",
        operator: "is",
      }),
    );
  },
};

/** Removing the first row promotes the second to "Where". */
export const RemoveFirstRow: Story = {
  args: { modelValue: MULTIPLE_CONDITIONS.slice(0, 2) },
  play: async ({ canvasElement, args }) => {
    await open(canvasElement);
    await userEvent.click(
      screen.getAllByRole("button", { name: "Remove filter" })[0]!,
    );
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([
        expect.objectContaining({ field: "status" }),
      ]),
    );
    await waitFor(() => expect(screen.queryByText("And")).toBeNull());
    await expect(screen.getByText("Where")).toBeInTheDocument();
    await expect(trigger(canvasElement)).toHaveTextContent("1");
  },
};

/** Removing the last row empties the value and closes the panel. */
export const RemoveLastRow: Story = {
  args: { modelValue: [PROJECT_CONDITION] },
  play: async ({ canvasElement, args }) => {
    await open(canvasElement);
    await userEvent.click(
      screen.getByRole("button", { name: "Remove filter" }),
    );
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([]),
    );
    await waitFor(() =>
      expect(trigger(canvasElement)).toHaveAttribute("aria-expanded", "false"),
    );
    await expect(
      within(canvasElement).queryByRole("button", {
        name: "Clear all filters",
      }),
    ).toBeNull();
  },
};

export const ClearAll: Story = {
  args: { modelValue: MULTIPLE_CONDITIONS },
  play: async ({ canvasElement, args }) => {
    const button = trigger(canvasElement);
    await expect(button).toHaveTextContent("3");
    await userEvent.click(button);
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Remove filter" }),
      ).toHaveLength(3),
    );

    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Clear all filters" }),
    );
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([]),
    );
    await expect(args.onClearAll).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-expanded", "false"),
    );
    await expect(button).not.toHaveTextContent("3");
    await expect(
      within(canvasElement).queryByRole("button", {
        name: "Clear all filters",
      }),
    ).toBeNull();
  },
};

export const MaxFilters: Story = {
  args: { maxFilters: 2 },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(trigger(canvasElement));
    await userEvent.click(
      await screen.findByRole("button", { name: "Add filter" }),
    );
    await waitFor(() =>
      expect(lastEmitted(args["onUpdate:modelValue"])).toHaveLength(2),
    );
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Add filter" })).toBeNull(),
    );
  },
};

export const ExternalFiltersClearAll: Story = {
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { Filter, TextInput },
      setup: () => {
        const search = ref("");
        const external = computed(() => (search.value ? 1 : 0));
        return { args, search, external, ...useModelValue(args, updateArgs) };
      },
      template: `
        <div class="flex items-center justify-center gap-2">
          <TextInput v-model="search" placeholder="Search" aria-label="Search" />
          <Filter
            v-bind="args"
            :external-filter-count="external"
            @update:model-value="setValue"
            @clear-all="search = ''"
          />
        </div>
      `,
    };
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = trigger(canvasElement);
    await userEvent.type(canvas.getByRole("textbox", { name: "Search" }), "x");
    await waitFor(() => expect(button).toHaveTextContent("1"));

    await userEvent.click(
      canvas.getByRole("button", { name: "Clear all filters" }),
    );
    await expect(args.onClearAll).toHaveBeenCalledTimes(1);
    await expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([]);
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Search" })).toHaveValue(""),
    );
    await expect(
      canvas.queryByRole("button", { name: "Clear all filters" }),
    ).toBeNull();
  },
};

const LinkField: Story = {
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { Filter, Combobox },
      setup: () => ({
        args,
        ...useModelValue(args, updateArgs),
        linkOptions,
        labelOf: (field: FilterField, v: unknown) =>
          linkOptions(field).find((o) => o.value === v)?.label,
      }),
      template: `
        <div class="flex justify-center">
          <Filter v-bind="args" @update:model-value="setValue">
            <template #link-value="{ field, value, setValue, disabled }">
              <Combobox
                class="min-w-35"
                aria-label="Value"
                placeholder="Value"
                :options="linkOptions(field)"
                :model-value="value"
                :disabled="disabled"
                @update:model-value="(v) => setValue(v == null ? null : String(v), labelOf(field, v))"
              />
            </template>
          </Filter>
        </div>
      `,
    };
  },
};

/** A link field's value comes from the link-value slot, with its label. */
export const LinkValueSlot: Story = {
  ...LinkField,
  play: async ({ canvasElement, args }) => {
    const spy = args["onUpdate:modelValue"];
    await open(canvasElement);
    await pick(
      screen.getByRole("combobox", { name: "Field" }),
      "Customer (Link)",
    );
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
        expect.objectContaining({ field: "customer_link", operator: "=" }),
      ]),
    );
    await pick(screen.getByRole("combobox", { name: "Value" }), "Jane Smith");
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
        expect.objectContaining({
          field: "customer_link",
          operator: "=",
          value: "jane",
          displayLabel: "Jane Smith",
        }),
      ]),
    );
  },
};

/** The "is" operator swaps the slot for a Set / Not set list. */
export const LinkIsOperator: Story = {
  ...LinkField,
  args: {
    modelValue: [
      { id: "1", field: "customer_link", operator: "=", value: "jane" },
    ],
  },
  play: async ({ canvasElement, args }) => {
    await open(canvasElement);
    await pick(screen.getByRole("combobox", { name: "Operator" }), "is");
    await pick(screen.getByRole("combobox", { name: "Value" }), "Not set");
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([
        expect.objectContaining({
          field: "customer_link",
          operator: "is",
          value: "is_not_set",
        }),
      ]),
    );
  },
};
