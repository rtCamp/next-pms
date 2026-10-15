import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { Button, TextInput } from "frappe-ui";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import TaskCard from "./TaskCard.vue";
import TaskRow from "./TaskRow.vue";
import { CARD, LOCKED, WEEK } from "./TaskRow.fixtures";

const meta = {
  title: "Components/Timesheet/TaskRow/Interactions",
  component: TaskRow,
  tags: ["interaction"],
  parameters: { layout: "padded" },
  args: {
    label: "UI Responsiveness Testing",
    status: "Working",
    totalHours: "08:00",
    timeEntries: WEEK,
    guard: fn((action: () => void) => action()),
    onCellClick: fn(),
    onStar: fn(),
    onLabelClick: fn(),
  },
  render: (args) => ({
    components: { TaskRow, TaskCard, TextInput, Button },
    setup: () => ({ args, card: CARD }),
    template: `
      <TaskRow v-bind="args">
        <template #card><TaskCard v-bind="card" /></template>
        <template #entry="{ dayIndex, close, setEngaged }">
          <div class="flex w-60 flex-col gap-2 p-2">
            <p class="text-sm text-ink-gray-7">Entries for day {{ dayIndex + 1 }}</p>
            <TextInput aria-label="Description" @update:model-value="setEngaged(true)" />
            <Button label="Save" @click="close" />
          </div>
        </template>
      </TaskRow>
    `,
  }),
} satisfies Meta<typeof TaskRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const editor = () => screen.queryByRole("textbox", { name: "Description" });

async function openAndEdit(canvasElement: HTMLElement) {
  await userEvent.click(
    within(canvasElement).getByRole("button", { name: "01:15" }),
  );
  await userEvent.type(
    await screen.findByRole("textbox", { name: "Description" }),
    "QA",
  );
}

export const NamesStatus: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("img", { name: "Working" }),
    ).toBeInTheDocument();
  },
};

export const StarEmitsStar: Story = {
  play: async ({ canvasElement, args }) => {
    const star = within(canvasElement).getByRole("button", {
      name: "Star task",
    });
    await expect(star).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(star);
    await expect(args.onStar).toHaveBeenCalledTimes(1);
  },
};

export const StarredOffersUnstar: Story = {
  args: { starred: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", { name: "Unstar task" }),
    ).toHaveAttribute("aria-pressed", "true");
  },
};

export const HidesStarButton: Story = {
  args: { hideStarButton: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByRole("button", { name: /star task/i }),
    ).toBeNull();
  },
};

export const LabelClickEmits: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: "UI Responsiveness Testing",
      }),
    );
    await expect(args.onLabelClick).toHaveBeenCalledTimes(1);
  },
};

export const CardOnLabelHover: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(
      within(canvasElement).getByRole("button", {
        name: "UI Responsiveness Testing",
      }),
    );
    await expect(
      await screen.findByRole("progressbar", {
        name: "Actual against estimated time",
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Blue Harbour CMS Migration")).toBeVisible(),
    );
  },
};

export const CellClickEmitsDay: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "02:30" }),
    );
    await expect(args.onCellClick).toHaveBeenCalledWith(2);
  },
};

export const LockedCellDoesNotEmit: Story = {
  args: { timeEntries: LOCKED },
  play: async ({ canvasElement, args }) => {
    const cell = within(canvasElement).getByRole("button", { name: "03:00" });
    await expect(cell).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(cell);
    await expect(args.onCellClick).not.toHaveBeenCalled();
  },
};

export const LockedEmptyCellStaysClosed: Story = {
  args: { timeEntries: LOCKED },
  play: async ({ canvasElement }) => {
    const [locked] = within(canvasElement).getAllByRole("button", {
      name: "Add time",
    });
    await expect(locked).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(locked!);
    await expect(editor()).toBeNull();
  },
};

export const LockedCellWithTimeOpens: Story = {
  args: { timeEntries: LOCKED },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "03:00" }),
    );
    const title = await screen.findByText("Entries for day 1");
    await waitFor(() => expect(title).toBeVisible());
  },
};

export const EntryOpensOnPress: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "02:30" }),
    );
    const title = await screen.findByText("Entries for day 3");
    await waitFor(() => expect(title).toBeVisible());
  },
};

export const EscapeAsksGuardAndCloses: Story = {
  play: async ({ canvasElement, args }) => {
    await openAndEdit(canvasElement);
    await userEvent.keyboard("{Escape}");
    await expect(args.guard).toHaveBeenCalled();
    await waitFor(() => expect(editor()).toBeNull());
  },
};

export const RefusingGuardKeepsEntryOpen: Story = {
  args: { guard: fn() },
  play: async ({ canvasElement, args }) => {
    await openAndEdit(canvasElement);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(args.guard).toHaveBeenCalled());
    await expect(editor()).toBeInTheDocument();
  },
};

export const SaveClosesWithoutGuard: Story = {
  play: async ({ canvasElement, args }) => {
    await openAndEdit(canvasElement);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(editor()).toBeNull());
    await expect(args.guard).not.toHaveBeenCalled();
  },
};

export const NamesNonBillableTime: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("button", {
        name: "02:00 Non-billable",
      }),
    ).toBeInTheDocument();
  },
};
