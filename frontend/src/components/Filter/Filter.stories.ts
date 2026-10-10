import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, ref } from "vue";
import { Combobox, TextInput } from "frappe-ui";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import Filter from "./Filter.vue";
import type { FilterCondition, FilterField } from "./types";

const projectOptions = [
  { label: "Atlas UI Stabilization", value: "atlas-ui" },
  { label: "Backend Refactor", value: "backend" },
  { label: "Mobile App v2", value: "mobile-v2" },
  { label: "Dashboard Redesign", value: "dashboard" },
  { label: "API Documentation", value: "api-docs" },
];

const statusOptions = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in-progress" },
  { label: "Review", value: "review" },
  { label: "Done", value: "done" },
  { label: "Cancelled", value: "cancelled" },
];

const priorityOptions = [
  { label: "Urgent", value: "urgent" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const assigneeOptions = [
  { label: "John Doe", value: "john" },
  { label: "Jane Smith", value: "jane" },
  { label: "Bob Wilson", value: "bob" },
  { label: "Alice Johnson", value: "alice" },
];

const sampleFields: FilterField[] = [
  {
    name: "project",
    label: "Project",
    type: "select",
    options: projectOptions,
  },
  { name: "status", label: "Status", type: "select", options: statusOptions },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    options: priorityOptions,
  },
  {
    name: "assignee",
    label: "Assignee",
    type: "select",
    options: assigneeOptions,
  },
  {
    name: "customer_link",
    label: "Customer (Link)",
    type: "link",
    link: { doctype: "User", labelField: "full_name" },
  },
  { name: "title", label: "Title", type: "string" },
  { name: "due_date", label: "Due Date", type: "date" },
  { name: "estimate", label: "Estimate (hours)", type: "number" },
  { name: "date_range", label: "Date Range", type: "daterange" },
];

const mockLinkRecords: Record<string, Record<string, string>[]> = {
  User: [
    { name: "john", full_name: "John Doe" },
    { name: "jane", full_name: "Jane Smith" },
    { name: "bob", full_name: "Bob Wilson" },
    { name: "alice", full_name: "Alice Johnson" },
  ],
};

function linkOptions(field: FilterField) {
  const link = field.link!;
  const labelField = link.labelField ?? "name";
  const valueField = link.valueField ?? "name";
  return (mockLinkRecords[link.doctype] ?? []).map((r) => ({
    label: r[labelField] ?? r[valueField],
    value: r[valueField],
  }));
}

const condition = (
  id: string,
  field: string,
  operator: string,
  value: FilterCondition["value"],
): FilterCondition => ({ id, field, operator, value });

const meta = {
  title: "Components/Filter",
  component: Filter,
  tags: ["autodocs"],
  parameters: { docs: { story: { height: "400px" } } },
  args: {
    fields: sampleFields,
    "onUpdate:modelValue": fn(),
    "onUpdate:open": fn(),
    onClearAll: fn(),
  },
  argTypes: {
    side: { control: "select", options: ["top", "right", "bottom", "left"] },
    align: { control: "select", options: ["start", "center", "end"] },
  },
  render: (args) => ({
    components: { Filter },
    setup: () => ({ args, value: ref(args.modelValue ?? []) }),
    template: `
      <div class="flex justify-center">
        <Filter v-bind="args" v-model="value" />
      </div>
    `,
  }),
} satisfies Meta<typeof Filter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInitialFilters: Story = {
  args: { modelValue: [condition("1", "project", "is", "atlas-ui")] },
};

export const MultipleFilters: Story = {
  args: {
    modelValue: [
      condition("1", "project", "is", "atlas-ui"),
      condition("2", "status", "is", "in-progress"),
      condition("3", "assignee", "is", "john"),
    ],
  },
};

export const WithoutCount: Story = {
  args: {
    showCount: false,
    modelValue: [condition("1", "project", "is", "atlas-ui")],
  },
};

export const LimitedFilters: Story = {
  args: { maxFilters: 3 },
};

export const SimpleFields: Story = {
  args: {
    fields: [
      { name: "name", label: "Name", type: "string" },
      { name: "email", label: "Email", type: "string" },
      { name: "age", label: "Age", type: "number" },
    ],
  },
};

export const DefaultOpen: Story = {
  args: { defaultOpen: true },
};

export const WithExternalFilters: Story = {
  render: (args) => ({
    components: { Filter, TextInput },
    setup: () => {
      const search = ref("");
      const value = ref(args.modelValue ?? []);
      const external = computed(() => (search.value ? 1 : 0));
      return { args, search, value, external };
    },
    template: `
      <div class="flex items-center justify-center gap-2">
        <TextInput v-model="search" placeholder="Search" aria-label="Search" />
        <Filter
          v-bind="args"
          v-model="value"
          :external-filter-count="external"
          @clear-all="search = ''"
        />
      </div>
    `,
  }),
};

export const LinkField: Story = {
  render: (args) => ({
    components: { Filter, Combobox },
    setup: () => ({
      args,
      value: ref(args.modelValue ?? []),
      linkOptions,
      labelOf: (field: FilterField, v: unknown) =>
        linkOptions(field).find((o) => o.value === v)?.label,
    }),
    template: `
      <div class="flex justify-center">
        <Filter v-bind="args" v-model="value">
          <template #link-value="{ field, value, setValue, disabled }">
            <Combobox
              class="min-w-[140px]"
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
  }),
};

// ── Interaction stories ─────────────────────────────────────────────────────

const trigger = (canvasElement: HTMLElement) =>
  within(canvasElement).getByRole("button", { name: /^Filter/ });

async function pick(combobox: HTMLElement, option: string) {
  await userEvent.click(combobox);
  await userEvent.click(await screen.findByRole("option", { name: option }));
}

const lastEmitted = (spy: unknown) => {
  const calls = (spy as ReturnType<typeof fn>).mock.calls;
  return calls[calls.length - 1][0] as FilterCondition[];
};

export const AddCondition: Story = {
  tags: ["interaction"],
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

    await pick(screen.getByRole("combobox", { name: "Operator" }), "is not");
    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenLastCalledWith([
        expect.objectContaining({ field: "project", operator: "is_not" }),
      ]),
    );

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
    await expect(button).toHaveTextContent("1");
    await expect(
      within(canvasElement).getByRole("button", { name: "Clear all filters" }),
    ).toBeInTheDocument();
  },
};

export const ChangeFieldType: Story = {
  tags: ["interaction"],
  args: { modelValue: [condition("1", "project", "is", "atlas-ui")] },
  play: async ({ canvasElement, args }) => {
    const spy = args["onUpdate:modelValue"];
    await userEvent.click(trigger(canvasElement));
    const field = await screen.findByRole("combobox", { name: "Field" });
    await waitFor(() => expect(field).toHaveValue("Project"));
    await expect(screen.getByRole("combobox", { name: "Value" })).toHaveValue(
      "Atlas UI Stabilization",
    );

    // select → string: operator becomes the first string operator, value resets.
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

    // string → number: numeric input.
    await pick(
      screen.getByRole("combobox", { name: "Field" }),
      "Estimate (hours)",
    );
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
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

    // number → date: date picker; typed date commits on Enter.
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
    const date = screen.getByRole("combobox", { name: "Value" });
    await userEvent.type(date, "2026-01-15{Enter}");
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
        expect.objectContaining({ field: "due_date", value: "2026-01-15" }),
      ]),
    );

    // An operator without a value clears and hides the value input.
    await pick(screen.getByRole("combobox", { name: "Operator" }), "is empty");
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
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

    // Same-type operator change keeps the value.
    await pick(screen.getByRole("combobox", { name: "Field" }), "Status");
    await pick(screen.getByRole("combobox", { name: "Value" }), "Review");
    await pick(screen.getByRole("combobox", { name: "Operator" }), "is not");
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
        expect.objectContaining({
          field: "status",
          operator: "is_not",
          value: "review",
        }),
      ]),
    );
  },
};

export const AddAndRemoveRows: Story = {
  tags: ["interaction"],
  args: { modelValue: [condition("1", "project", "is", "atlas-ui")] },
  play: async ({ canvasElement, args }) => {
    const spy = args["onUpdate:modelValue"];
    const button = trigger(canvasElement);
    await userEvent.click(button);
    await userEvent.click(
      await screen.findByRole("button", { name: "Add filter" }),
    );
    await screen.findByText("And");
    await waitFor(() => expect(lastEmitted(spy)).toHaveLength(2));
    await expect(lastEmitted(spy)[1]).toMatchObject({
      field: "project",
      operator: "",
      value: null,
    });
    await expect(button).toHaveTextContent("2");

    await pick(
      screen.getAllByRole("combobox", { name: "Field" })[1],
      "Priority",
    );
    await waitFor(() =>
      expect(lastEmitted(spy)[1]).toMatchObject({
        field: "priority",
        operator: "is",
      }),
    );

    // Removing the first row promotes the second to "Where".
    await userEvent.click(
      screen.getAllByRole("button", { name: "Remove filter" })[0],
    );
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
        expect.objectContaining({ field: "priority" }),
      ]),
    );
    await waitFor(() => expect(screen.queryByText("And")).toBeNull());
    await expect(screen.getByText("Where")).toBeInTheDocument();
    await expect(button).toHaveTextContent("1");

    // Removing the last row empties the value and closes the panel.
    await userEvent.click(
      screen.getByRole("button", { name: "Remove filter" }),
    );
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith([]));
    await waitFor(() =>
      expect(button).toHaveAttribute("aria-expanded", "false"),
    );
    await expect(
      within(canvasElement).queryByRole("button", {
        name: "Clear all filters",
      }),
    ).toBeNull();
  },
};

export const ClearAll: Story = {
  tags: ["interaction"],
  args: { ...MultipleFilters.args },
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
  tags: ["interaction"],
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
  ...WithExternalFilters,
  tags: ["interaction"],
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

export const LinkValueSlot: Story = {
  ...LinkField,
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    const spy = args["onUpdate:modelValue"];
    await userEvent.click(trigger(canvasElement));
    await pick(
      await screen.findByRole("combobox", { name: "Field" }),
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

    // The "is" operator swaps the slot for a Set / Not set list.
    await pick(screen.getByRole("combobox", { name: "Operator" }), "is");
    await pick(screen.getByRole("combobox", { name: "Value" }), "Not set");
    await waitFor(() =>
      expect(spy).toHaveBeenLastCalledWith([
        expect.objectContaining({
          field: "customer_link",
          operator: "is",
          value: "is_not_set",
        }),
      ]),
    );
  },
};
