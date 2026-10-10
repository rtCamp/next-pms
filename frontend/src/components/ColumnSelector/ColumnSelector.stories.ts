import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import ColumnSelector from "./ColumnSelector.vue";
import type { SelectorColumn } from "./types";

const ticketColumns: SelectorColumn[] = [
  { label: "ID", value: "name" },
  { label: "Subject", value: "subject" },
  { label: "Status", value: "status" },
  { label: "Priority", value: "priority" },
  { label: "Customer", value: "customer" },
];

const ticketFields: SelectorColumn[] = [
  ...ticketColumns,
  { label: "Description", value: "description" },
  { label: "Team", value: "agent_group" },
  { label: "Type", value: "ticket_type" },
  { label: "Total Hold Time", value: "total_hold_time" },
];

const meta = {
  title: "Components/ColumnSelector",
  component: ColumnSelector,
  tags: ["autodocs"],
  args: {
    modelValue: ticketColumns,
    availableColumns: ticketFields,
    "onUpdate:modelValue": fn(),
    onReset: fn(),
  },
  argTypes: {
    minColumns: { control: "number" },
    maxPinned: { control: "number" },
    side: { control: "select", options: ["top", "right", "bottom", "left"] },
    align: { control: "select", options: ["start", "center", "end"] },
  },
  render: (args) => ({
    components: { ColumnSelector },
    setup() {
      const columns = ref(args.modelValue);
      // The component only emits `reset`; restoring the columns is the parent's job.
      const reset = () => (columns.value = args.modelValue);
      return { args, columns, reset };
    },
    template: `
      <div class="flex justify-center p-8">
        <ColumnSelector v-bind="args" v-model="columns" @reset="reset" />
      </div>
    `,
  }),
} satisfies Meta<typeof ColumnSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const values = (columns: SelectorColumn[]) => columns.map((c) => c.value);

const lastEmitted = (spy: unknown) =>
  (spy as ReturnType<typeof fn>).mock.lastCall?.[0] as SelectorColumn[];

const openSelector = async (canvasElement: HTMLElement, name = "Columns") => {
  await userEvent.click(within(canvasElement).getByRole("button", { name }));
  return screen.findByRole("dialog");
};

const addColumnTrigger = (name = "Add Column") =>
  screen.getByRole("button", { name });

const listedLabels = () =>
  screen
    .getAllByRole("listitem")
    .map((item) => item.querySelector("[data-column-label]")?.textContent);

const pinnedFirstTwo = ticketColumns.map((column, index) => ({
  ...column,
  pinned: index < 2,
}));

const french = {
  trigger: "Colonnes",
  addColumn: "Ajouter une colonne",
  search: "Rechercher une colonne",
  resetToDefault: "Réinitialiser",
  remove: "Supprimer la colonne",
  reorder: "Réordonner la colonne",
  reorderHint:
    "Espace pour saisir, flèches pour déplacer, Espace pour déposer, Échap pour annuler.",
  pin: "Épingler la colonne",
  unpin: "Désépingler la colonne",
  pinLimit: "Limite d'épinglage atteinte",
};

// Visual stories

export const Default: Story = {
  args: { resettable: true },
};

export const IconOnlyTrigger: Story = {
  args: { ...Default.args, hideLabel: true },
};

export const AtMinimumColumns: Story = {
  args: { ...Default.args, modelValue: [ticketColumns[0]] },
};

export const AllColumnsAdded: Story = {
  args: { ...Default.args, modelValue: ticketFields },
};

export const WithoutReset: Story = {
  args: { resettable: false },
};

export const Pinnable: Story = {
  args: { ...Default.args, pinnable: true, modelValue: pinnedFirstTwo },
};

export const PinLimitReached: Story = {
  args: { ...Pinnable.args, maxPinned: 2 },
};

export const NotReorderable: Story = {
  args: { ...Default.args, reorderable: false },
};

export const Disabled: Story = {
  args: { ...Default.args, disabled: true },
};

export const TranslatedLabels: Story = {
  args: { ...Default.args, labels: french },
};

/**
 * Drag a row by its grip handle to reorder it. Open the story and try it with
 * a mouse; the play function drives the same handlers with synthetic drag events.
 */
export const DragToReorder: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    const handle = screen.getByRole("button", { name: "Reorder column: ID" });
    await expect(handle).toHaveAttribute("draggable", "true");

    const dataTransfer = new DataTransfer();
    const drag = (type: string, target: Element) =>
      target.dispatchEvent(
        new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }),
      );
    drag("dragstart", handle);
    drag("dragover", screen.getAllByRole("listitem")[2]);
    await waitFor(() =>
      expect(listedLabels()).toEqual([
        "Subject",
        "Status",
        "ID",
        "Priority",
        "Customer",
      ]),
    );
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();

    drag("drop", screen.getAllByRole("listitem")[2]);
    drag("dragend", handle);

    await waitFor(() =>
      expect(args["onUpdate:modelValue"]).toHaveBeenCalledTimes(1),
    );
    await expect(values(lastEmitted(args["onUpdate:modelValue"]))).toEqual([
      "subject",
      "status",
      "name",
      "priority",
      "customer",
    ]);
  },
};

// Interaction stories

export const RemovesColumn: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    await userEvent.click(
      screen.getByRole("button", { name: "Remove column: Status" }),
    );

    await waitFor(() =>
      expect(listedLabels()).toEqual(["ID", "Subject", "Priority", "Customer"]),
    );
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledTimes(1);
    await expect(values(lastEmitted(args["onUpdate:modelValue"]))).toEqual([
      "name",
      "subject",
      "priority",
      "customer",
    ]);
  },
};

export const AddsUnusedColumn: Story = {
  tags: ["interaction"],
  args: { availableColumns: ticketFields.slice(0, 7) },
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    await userEvent.click(addColumnTrigger());

    const options = await screen.findAllByRole("option");
    await expect(options.map((o) => o.textContent?.trim())).toEqual([
      "Description",
      "Team",
    ]);

    await userEvent.click(screen.getByRole("option", { name: "Team" }));

    await waitFor(() =>
      expect(listedLabels()).toEqual([
        "ID",
        "Subject",
        "Status",
        "Priority",
        "Customer",
        "Team",
      ]),
    );
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledTimes(1);
    await expect(screen.getByRole("dialog")).toBeInTheDocument();
  },
};

export const SearchesColumnsToAdd: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement);
    await userEvent.click(addColumnTrigger());

    await userEvent.type(
      await screen.findByPlaceholderText("Search columns"),
      "time",
    );
    await waitFor(async () =>
      expect(
        (await screen.findAllByRole("option")).map((o) =>
          o.textContent?.trim(),
        ),
      ).toEqual(["Total Hold Time"]),
    );
    await userEvent.keyboard("[Enter]");

    await waitFor(() => expect(listedLabels()).toContain("Total Hold Time"));
  },
};

export const HidesRemoveAtMinimum: Story = {
  tags: ["interaction"],
  args: { modelValue: [ticketColumns[0]] },
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement);

    await expect(listedLabels()).toEqual(["ID"]);
    await expect(
      screen.queryByRole("button", { name: /^Remove column/ }),
    ).not.toBeInTheDocument();
    await expect(addColumnTrigger()).toHaveTextContent("Add Column");
  },
};

export const HidesAddColumnWhenEveryColumnIsAdded: Story = {
  tags: ["interaction"],
  args: { modelValue: ticketFields },
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement);

    await expect(
      screen.queryByRole("button", { name: "Add Column" }),
    ).not.toBeInTheDocument();
    await expect(screen.queryByText("Add Column")).not.toBeInTheDocument();
  },
};

export const ResetEmitsOnly: Story = {
  tags: ["interaction"],
  args: { resettable: true },
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    await userEvent.click(
      screen.getByRole("button", { name: "Remove column: Customer" }),
    );
    await waitFor(() => expect(listedLabels()).toHaveLength(4));

    await userEvent.click(
      screen.getByRole("button", { name: "Reset to Default" }),
    );

    await expect(args.onReset).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(listedLabels()).toHaveLength(5));
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledTimes(1);
  },
};

export const OmitsResetWhenNotResettable: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement);

    await expect(
      screen.queryByRole("button", { name: "Reset to Default" }),
    ).not.toBeInTheDocument();
  },
};

export const ReordersWithKeyboard: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    const handle = screen.getByRole("button", {
      name: "Reorder column: Subject",
    });
    handle.focus();
    await userEvent.keyboard("[Space]");
    await expect(handle).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("[ArrowDown]");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Reorder column: Subject" }),
      ).toHaveFocus(),
    );
    await userEvent.keyboard("[Space]");

    await waitFor(() =>
      expect(listedLabels()).toEqual([
        "ID",
        "Status",
        "Subject",
        "Priority",
        "Customer",
      ]),
    );
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledTimes(1);
    await expect(
      screen.getByRole("button", { name: "Reorder column: Subject" }),
    ).toHaveAttribute("aria-pressed", "false");
  },
};

export const CancelsKeyboardReorderWithEscape: Story = {
  tags: ["interaction"],
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    screen.getByRole("button", { name: "Reorder column: ID" }).focus();
    await userEvent.keyboard("[Space]");
    await userEvent.keyboard("[ArrowDown]");
    await userEvent.keyboard("[ArrowDown]");
    await waitFor(() =>
      expect(listedLabels()).toEqual([
        "Subject",
        "Status",
        "ID",
        "Priority",
        "Customer",
      ]),
    );

    await userEvent.keyboard("[Escape]");

    await waitFor(() =>
      expect(listedLabels()).toEqual([
        "ID",
        "Subject",
        "Status",
        "Priority",
        "Customer",
      ]),
    );
    await expect(screen.getByRole("dialog")).toBeInTheDocument();
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();
  },
};

export const HidesDragHandlesWhenNotReorderable: Story = {
  tags: ["interaction"],
  args: { reorderable: false },
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement);

    await expect(
      screen.queryByRole("button", { name: /^Reorder column/ }),
    ).not.toBeInTheDocument();
  },
};

export const PinsAndUnpinsColumn: Story = {
  tags: ["interaction"],
  args: { pinnable: true },
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    await userEvent.click(
      screen.getByRole("button", { name: "Pin column: Status" }),
    );

    await waitFor(() =>
      expect(listedLabels()).toEqual([
        "Status",
        "ID",
        "Subject",
        "Priority",
        "Customer",
      ]),
    );
    const unpin = screen.getByRole("button", { name: "Unpin column: Status" });
    await expect(unpin).toHaveAttribute("aria-pressed", "true");
    await expect(lastEmitted(args["onUpdate:modelValue"])[0]).toMatchObject({
      value: "status",
      pinned: true,
    });

    await userEvent.click(unpin);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Pin column: Status" }),
      ).toHaveAttribute("aria-pressed", "false"),
    );
    await expect(listedLabels()).toEqual([
      "Status",
      "ID",
      "Subject",
      "Priority",
      "Customer",
    ]);
    await expect(
      screen.queryByRole("button", { name: /^Unpin column/ }),
    ).not.toBeInTheDocument();
  },
};

export const ListsPinnedColumnsFirst: Story = {
  tags: ["interaction"],
  args: {
    pinnable: true,
    modelValue: ticketColumns.map((column) => ({
      ...column,
      pinned: column.value === "priority",
    })),
  },
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement);

    await expect(listedLabels()).toEqual([
      "Priority",
      "ID",
      "Subject",
      "Status",
      "Customer",
    ]);
    await expect(
      screen.getByRole("button", { name: "Unpin column: Priority" }),
    ).toHaveAttribute("aria-pressed", "true");
  },
};

export const BlocksPinningAtLimit: Story = {
  tags: ["interaction"],
  args: { pinnable: true, maxPinned: 2, modelValue: pinnedFirstTwo },
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    const pin = screen.getByRole("button", {
      name: "Pin limit reached: Status",
    });
    await expect(pin).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(pin);
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Unpin column: ID" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Pin column: Status" }),
      ).toHaveAttribute("aria-disabled", "false"),
    );
  },
};

export const KeepsKeyboardReorderWithinGroup: Story = {
  tags: ["interaction"],
  args: {
    pinnable: true,
    modelValue: ticketColumns.map((column) => ({
      ...column,
      pinned: column.value === "name",
    })),
  },
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    screen.getByRole("button", { name: "Reorder column: Subject" }).focus();
    await userEvent.keyboard("[Space]");
    await userEvent.keyboard("[ArrowUp]");
    await userEvent.keyboard("[Space]");

    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(listedLabels()).toEqual([
      "ID",
      "Subject",
      "Status",
      "Priority",
      "Customer",
    ]);
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();
  },
};

export const DisabledTriggerStaysClosed: Story = {
  tags: ["interaction"],
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", {
      name: "Columns",
    });
    await expect(trigger).toBeDisabled();

    await userEvent.click(trigger, { pointerEventsCheck: 0 });

    await expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

export const UsesTranslatedLabels: Story = {
  tags: ["interaction"],
  args: {
    pinnable: true,
    resettable: true,
    labels: {
      trigger: "Colonnes",
      addColumn: "Ajouter une colonne",
      resetToDefault: "Réinitialiser",
      remove: "Supprimer la colonne",
      reorder: "Réordonner la colonne",
      pin: "Épingler la colonne",
    },
  },
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement, "Colonnes");

    await expect(addColumnTrigger("Ajouter une colonne")).toBeInTheDocument();
    await expect(
      screen.getByRole("button", { name: "Réinitialiser" }),
    ).toBeInTheDocument();
    await expect(
      screen.getByRole("button", { name: "Supprimer la colonne: ID" }),
    ).toBeInTheDocument();
    await expect(
      screen.getByRole("button", { name: "Réordonner la colonne: ID" }),
    ).toBeInTheDocument();
    await expect(
      screen.getByRole("button", { name: "Épingler la colonne: ID" }),
    ).toBeInTheDocument();
  },
};
