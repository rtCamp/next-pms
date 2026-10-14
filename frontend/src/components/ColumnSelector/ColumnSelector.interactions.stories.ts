import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import ColumnSelector from "./ColumnSelector.vue";
import type { SelectorColumn } from "./types";
import {
  PINNED_FIRST_TWO,
  TICKET_COLUMNS,
  TICKET_FIELDS,
} from "./ColumnSelector.fixtures";

const meta = {
  title: "Components/ColumnSelector/Interactions",
  component: ColumnSelector,
  tags: ["interaction"],
  args: {
    modelValue: TICKET_COLUMNS,
    availableColumns: TICKET_FIELDS,
    "onUpdate:modelValue": fn(),
    onReset: fn(),
  },
  render: (args, { initialArgs }) => {
    const [, updateArgs] = useArgs();
    // `updateArgs` syncs Controls; story tests only see the args write.
    const update = (modelValue: SelectorColumn[]) => {
      Object.assign(args, { modelValue });
      updateArgs({ modelValue });
    };
    return {
      components: { ColumnSelector },
      setup: () => ({
        args,
        update,
        // The component only emits `reset`; restoring the columns is the parent's job.
        reset: () => update(initialArgs.modelValue),
      }),
      template: `
        <div class="flex justify-center p-8">
          <ColumnSelector v-bind="args" @update:model-value="update" @reset="reset" />
        </div>
      `,
    };
  },
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
  screen.getAllByRole("listitem").map((item) => item.textContent?.trim());

const DEFAULT_ORDER = ["ID", "Subject", "Status", "Priority", "Customer"];

/**
 * Drag a row by its grip handle to reorder it. Open the story and try it with
 * a mouse; the play function drives the same handlers with synthetic drag events.
 */
export const DragToReorder: Story = {
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

export const RemovesColumn: Story = {
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
  args: { availableColumns: TICKET_FIELDS.slice(0, 7) },
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
      expect(listedLabels()).toEqual([...DEFAULT_ORDER, "Team"]),
    );
    await expect(args["onUpdate:modelValue"]).toHaveBeenCalledTimes(1);
    await expect(screen.getByRole("dialog")).toBeInTheDocument();
  },
};

export const SearchesColumnsToAdd: Story = {
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
  args: { modelValue: [TICKET_COLUMNS[0]] },
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
  args: { modelValue: TICKET_FIELDS },
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement);

    await expect(
      screen.queryByRole("button", { name: "Add Column" }),
    ).not.toBeInTheDocument();
    await expect(screen.queryByText("Add Column")).not.toBeInTheDocument();
  },
};

export const ResetEmitsOnly: Story = {
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
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement);

    await expect(
      screen.queryByRole("button", { name: "Reset to Default" }),
    ).not.toBeInTheDocument();
  },
};

export const ReordersWithKeyboard: Story = {
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

    await waitFor(() => expect(listedLabels()).toEqual(DEFAULT_ORDER));
    await expect(screen.getByRole("dialog")).toBeInTheDocument();
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();
  },
};

export const HidesDragHandlesWhenNotReorderable: Story = {
  args: { reorderable: false },
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement);

    await expect(
      screen.queryByRole("button", { name: /^Reorder column/ }),
    ).not.toBeInTheDocument();
  },
};

export const PinsColumn: Story = {
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
    await expect(
      screen.getByRole("button", { name: "Unpin column: Status" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(lastEmitted(args["onUpdate:modelValue"])[0]).toMatchObject({
      value: "status",
      pinned: true,
    });
  },
};

export const UnpinsColumn: Story = {
  args: {
    pinnable: true,
    modelValue: TICKET_COLUMNS.map((column) => ({
      ...column,
      pinned: column.value === "status",
    })),
  },
  play: async ({ canvasElement }) => {
    await openSelector(canvasElement);

    await userEvent.click(
      screen.getByRole("button", { name: "Unpin column: Status" }),
    );

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
  args: {
    pinnable: true,
    modelValue: TICKET_COLUMNS.map((column) => ({
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
  args: { pinnable: true, maxPinned: 2, modelValue: PINNED_FIRST_TWO },
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    const pin = screen.getByRole("button", {
      name: "Pin limit reached: Status",
    });
    await expect(pin).toBeDisabled();
    await userEvent.click(pin, { pointerEventsCheck: 0 });
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Unpin column: ID" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Pin column: Status" }),
      ).toBeEnabled(),
    );
  },
};

export const KeepsKeyboardReorderWithinGroup: Story = {
  args: {
    pinnable: true,
    modelValue: TICKET_COLUMNS.map((column) => ({
      ...column,
      pinned: column.value === "name",
    })),
  },
  play: async ({ canvasElement, args }) => {
    await openSelector(canvasElement);

    const handle = screen.getByRole("button", {
      name: "Reorder column: Subject",
    });
    handle.focus();
    await userEvent.keyboard("[Space]");
    await userEvent.keyboard("[ArrowUp]");
    await userEvent.keyboard("[Space]");

    await waitFor(() =>
      expect(handle).toHaveAttribute("aria-pressed", "false"),
    );
    await expect(listedLabels()).toEqual(DEFAULT_ORDER);
    await expect(args["onUpdate:modelValue"]).not.toHaveBeenCalled();
  },
};

export const DisabledTriggerStaysClosed: Story = {
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
