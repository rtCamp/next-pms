import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import TaskLog from "./TaskLog.vue";
import type { TaskLogDetails, TaskLogEntry, TaskWorker } from "./types";

const ASHA: TaskWorker = {
  employeeId: "HR-EMP-001",
  employeeName: "Asha Rao",
  image: null,
  totalHours: 6.5,
};
const KABIR: TaskWorker = {
  employeeId: "HR-EMP-002",
  employeeName: "Kabir Nair",
  image: null,
  totalHours: 3.25,
};

const DETAILS: TaskLogDetails = {
  subject: "Migrate the blog to the new CMS",
  status: "Working",
  projectName: "Blue Harbour CMS Migration",
  dueDate: "2026-10-30",
  actualHours: 9.75,
  estimatedHours: 12,
  workedBy: [ASHA, KABIR],
};

const ENTRIES: TaskLogEntry[] = [
  {
    date: "2026-10-12",
    employee: ASHA,
    description: "<p>Moved the <strong>author pages</strong>.</p>",
    hours: 4,
  },
  {
    date: "2026-10-09",
    employee: KABIR,
    description: "<p>Redirect map for old URLs.</p>",
    hours: 3.25,
  },
  {
    date: "2026-10-08",
    employee: ASHA,
    description: "<p>Content export.</p>",
    hours: 2.5,
  },
];

const meta = {
  title: "Components/TaskLog",
  component: TaskLog,
  tags: ["autodocs"],
  args: {
    open: true,
    range: 15,
    view: "personal",
    details: { ...DETAILS, workedBy: [ASHA] },
    entries: ENTRIES.filter((entry) => entry.employee === ASHA),
    loading: false,
    "onUpdate:open": fn(),
    "onUpdate:range": fn(),
  },
  render: (args) => ({
    components: { TaskLog },
    setup: () => {
      const open = ref(args.open);
      const range = ref(args.range);
      return { args, open, range };
    },
    template: `
      <TaskLog
        v-bind="args"
        v-model:open="open"
        v-model:range="range"
      />
    `,
  }),
} satisfies Meta<typeof TaskLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Personal: Story = {};

export const Team: Story = {
  args: { view: "team", details: DETAILS, entries: ENTRIES },
};

export const WithGitHubLink: Story = {
  args: {
    details: {
      ...DETAILS,
      workedBy: [ASHA],
      ghLink: "https://github.com/rtCamp/next-pms/issues/1",
    },
  },
};

export const OverEstimate: Story = {
  args: { details: { ...DETAILS, actualHours: 15, workedBy: [ASHA] } },
};

export const Empty: Story = {
  args: { details: { ...DETAILS, workedBy: [] }, entries: [] },
};

export const Loading: Story = { args: { loading: true } };

export const ShowsPersonalSummary: Story = {
  tags: ["interaction"],
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    const body = within(dialog);
    await expect(
      body.getByRole("heading", { name: DETAILS.subject }),
    ).toBeVisible();
    await expect(body.getByRole("img", { name: "Working" })).toBeVisible();
    await expect(body.getByText("Blue Harbour CMS Migration")).toBeVisible();
    await expect(body.getByText("30 Oct")).toBeVisible();
    await expect(body.getByText("09:45")).toBeVisible();
    await expect(body.getByText("12:00")).toBeVisible();
    await expect(body.getByText("81%")).toBeVisible();
    await expect(body.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "81",
    );
    // The viewer's own total, and no team heading or chips.
    await expect(body.getByText("06:30")).toBeVisible();
    await expect(body.queryByText("Time entries")).toBeNull();
    await expect(
      body.queryByRole("list", { name: "Time by member" }),
    ).toBeNull();
    const entries = body.getByRole("list", { name: "Time entries" });
    await expect(within(entries).getAllByRole("listitem")).toHaveLength(2);
    await expect(within(entries).getByText("Oct 12")).toBeVisible();
    await expect(within(entries).getByText("author pages")).toBeVisible();
  },
};

export const ShowsTeamSummary: Story = {
  tags: ["interaction"],
  args: { view: "team", details: DETAILS, entries: ENTRIES },
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    const body = within(dialog);
    await expect(body.getByText("Time entries")).toBeVisible();
    const members = body.getByRole("list", { name: "Time by member" });
    await expect(within(members).getAllByRole("listitem")).toHaveLength(2);
    await expect(within(members).getByText("Kabir Nair")).toBeVisible();
    await expect(within(members).getByText("03:15")).toBeVisible();
    const entries = body.getByRole("list", { name: "Time entries" });
    await expect(within(entries).getAllByRole("listitem")).toHaveLength(3);
  },
};

export const LinksTitleToGitHub: Story = {
  ...WithGitHubLink,
  tags: ["interaction"],
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    const link = within(dialog).getByRole("link", { name: DETAILS.subject });
    await expect(link).toHaveAttribute(
      "href",
      "https://github.com/rtCamp/next-pms/issues/1",
    );
    await expect(link).toHaveAttribute("target", "_blank");
  },
};

export const MarksOverEstimateRed: Story = {
  ...OverEstimate,
  tags: ["interaction"],
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    const body = within(dialog);
    await expect(body.getByText("125%")).toBeVisible();
    await expect(body.getByText("15:00")).toHaveClass("text-ink-red-8");
  },
};

export const ShowsEmptyText: Story = {
  ...Empty,
  tags: ["interaction"],
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    await expect(
      within(dialog).getByText(
        "No time logs found for the selected date range.",
      ),
    ).toBeVisible();
  },
};

export const ShowsSpinnerWhileLoading: Story = {
  ...Loading,
  tags: ["interaction"],
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    await expect(within(dialog).queryByText("Actual")).toBeNull();
    await expect(within(dialog).queryByRole("combobox")).toBeNull();
  },
};

export const ChangesRange: Story = {
  tags: ["interaction"],
  play: async ({ args }) => {
    const dialog = await screen.findByRole("dialog");
    const select = within(dialog).getByRole("combobox", { name: "Date range" });
    await expect(select).toHaveTextContent("Last 15 days");
    await userEvent.click(select);
    await userEvent.click(
      await screen.findByRole("option", { name: "Last 90 days" }),
    );
    await waitFor(() =>
      expect(args["onUpdate:range"]).toHaveBeenCalledWith(90),
    );
    await expect(select).toHaveTextContent("Last 90 days");
  },
};
