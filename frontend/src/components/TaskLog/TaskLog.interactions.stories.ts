import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import TaskLog from "./TaskLog.vue";
import visual, {
  Empty,
  Loading,
  OverEstimate,
  WithGitHubLink,
} from "./TaskLog.stories";
import { DETAILS, ENTRIES } from "./TaskLog.fixtures";

const meta = {
  ...visual,
  title: "Components/TaskLog/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof TaskLog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShowsPersonalSummary: Story = {
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

export const ShowsOverEstimate: Story = {
  ...OverEstimate,
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    const body = within(dialog);
    await expect(body.getByText("125%")).toBeVisible();
    await expect(body.getByText("15:00")).toBeVisible();
    await expect(body.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "125%",
    );
  },
};

export const ShowsEmptyText: Story = {
  ...Empty,
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
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    await expect(within(dialog).queryByText("Actual")).toBeNull();
    await expect(within(dialog).queryByRole("combobox")).toBeNull();
  },
};

export const ChangesRange: Story = {
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
