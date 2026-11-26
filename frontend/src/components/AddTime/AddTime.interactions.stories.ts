import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { dayjs } from "frappe-ui";
import { expect, fn, screen, userEvent, waitFor, within } from "storybook/test";
import AddTime from "./AddTime.vue";
import visual from "./AddTime.stories";
import { EVENTS, PREFILLED } from "./AddTime.fixtures";

const meta = {
  ...visual,
  title: "Components/AddTime/Interactions",
  tags: ["interaction"],
  parameters: {
    a11y: {
      // A closed frappe-ui Combobox keeps aria-activedescendant on an option reka-ui
      // has unmounted.
      options: { rules: { "aria-valid-attr-value": { enabled: false } } },
    },
  },
} satisfies Meta<typeof AddTime>;

export default meta;
type Story = StoryObj<typeof meta>;

const dialog = () => screen.findByRole("dialog", { name: "Add time" });

async function pickOption(field: string, option: string) {
  const body = within(await dialog());
  await userEvent.click(
    body.getByRole("combobox", { name: new RegExp(`^${field}`) }),
  );
  await userEvent.click(
    await screen.findByRole("option", { name: new RegExp(option) }),
  );
}

async function typeComment(text: string) {
  const comment = within(await dialog()).getByRole("textbox", {
    name: "Comment",
  });
  await userEvent.click(comment);
  await userEvent.type(comment, text);
}

async function typeDuration(value: string) {
  const input = within(await dialog()).getByRole("textbox", {
    name: /Duration/,
  });
  await userEvent.click(input);
  await userEvent.clear(input);
  await userEvent.type(input, value);
  await userEvent.tab();
}

export const RequiresEveryField: Story = {
  play: async ({ args }) => {
    const body = within(await dialog());
    await userEvent.click(body.getByRole("button", { name: "Save and close" }));
    await expect(await body.findByText("Select Project")).toBeVisible();
    await expect(body.getByText("Select Task")).toBeVisible();
    await expect(body.getByText("Select Duration")).toBeVisible();
    await expect(body.getByText("Please enter a comment.")).toBeVisible();
    await expect(body.queryByText("Select Date")).toBeNull();
    await expect(args.save).not.toHaveBeenCalled();
  },
};

export const RequiresAnEmployeeWhenPicked: Story = {
  args: { pickEmployee: true },
  play: async () => {
    const body = within(await dialog());
    await userEvent.click(body.getByRole("button", { name: "Save and close" }));
    await expect(
      await body.findByText("Please select an employee."),
    ).toBeVisible();
  },
};

export const TaskSetsItsProject: Story = {
  play: async () => {
    await pickOption("Task", "Push notifications");
    const body = within(await dialog());
    await waitFor(() =>
      expect(body.getByRole("combobox", { name: /^Project/ })).toHaveValue(
        "Mobile App",
      ),
    );
  },
};

export const ProjectChangeClearsTheTask: Story = {
  args: { prefill: PREFILLED },
  play: async () => {
    const body = within(await dialog());
    await expect(body.getByRole("combobox", { name: /^Task/ })).toHaveValue(
      "Fix login redirect",
    );
    await pickOption("Project", "Mobile App");
    await waitFor(() =>
      expect(body.getByRole("combobox", { name: /^Task/ })).toHaveValue(""),
    );
  },
};

export const DateShortcuts: Story = {
  play: async () => {
    const body = within(await dialog());
    const date = body.getByRole("combobox", { name: /Date/ });
    await userEvent.click(date);
    await userEvent.click(
      await screen.findByRole("button", { name: "Yesterday" }),
    );
    await waitFor(() =>
      expect(date).toHaveValue(
        dayjs().subtract(1, "day").format("MMM D, YYYY"),
      ),
    );
    await userEvent.click(date);
    await userEvent.click(await screen.findByRole("button", { name: "Clear" }));
    await waitFor(() => expect(date).toHaveValue(""));
    await userEvent.click(body.getByRole("button", { name: "Save and close" }));
    await expect(await body.findByText("Select Date")).toBeVisible();
  },
};

export const CalendarNeedsSetup: Story = {
  play: async () => {
    const body = within(await dialog());
    await expect(
      body.getByRole("checkbox", { name: "Add calendar events" }),
    ).toBeDisabled();
    await expect(body.getByRole("link", { name: "Enable" })).toHaveAttribute(
      "href",
      "/desk/google-calendar",
    );
  },
};

export const CalendarEventsFillTheEntry: Story = {
  args: { calendarSetup: true, calendarEvents: EVENTS },
  play: async () => {
    const body = within(await dialog());
    await userEvent.click(
      body.getByRole("checkbox", { name: "Add calendar events" }),
    );
    await userEvent.click(
      await body.findByRole("checkbox", { name: "Daily standup" }),
    );
    const comment = body.getByRole("textbox", { name: "Comment" });
    const duration = body.getByRole("textbox", { name: /Duration/ });
    await waitFor(() =>
      expect(comment).toHaveTextContent("Daily standup | 30m"),
    );
    await expect(duration).toHaveValue("00:30");
    await expect(body.getByText("1 of 2")).toBeVisible();

    await userEvent.click(body.getByRole("checkbox", { name: "Select all" }));
    await waitFor(() =>
      expect(comment).toHaveTextContent("Sprint review | 1hr"),
    );
    await expect(duration).toHaveValue("01:30");
    await expect(body.getByText("2 of 2")).toBeVisible();

    await userEvent.click(
      body.getByRole("checkbox", { name: "Daily standup" }),
    );
    await waitFor(() => expect(comment).not.toHaveTextContent("Daily standup"));
    await expect(duration).toHaveValue("01:00");
  },
};

export const SaveAndClose: Story = {
  args: { prefill: PREFILLED },
  play: async ({ args }) => {
    await typeDuration("1.5");
    await typeComment("Fixed the redirect");
    const body = within(await dialog());
    await userEvent.click(body.getByRole("button", { name: "Save and close" }));
    await waitFor(() =>
      expect(args.save).toHaveBeenCalledWith(
        expect.objectContaining({
          date: "2026-10-16",
          task: "TASK-0001",
          project: "PROJ-0001",
          duration: 1.5,
          comment: expect.stringContaining("Fixed the redirect"),
        }),
        false,
      ),
    );
    await expect(args["onUpdate:open"]).toHaveBeenCalledWith(false);
  },
};

export const SaveAndAddAnother: Story = {
  args: { prefill: PREFILLED },
  play: async ({ args }) => {
    await pickOption("Task", "Release checklist");
    await typeDuration("2");
    await typeComment("Wrote the checklist");
    const body = within(await dialog());
    await userEvent.click(
      body.getByRole("button", { name: "Save and add another" }),
    );
    await waitFor(() =>
      expect(args.save).toHaveBeenCalledWith(
        expect.objectContaining({ task: "TASK-0003", duration: 2 }),
        true,
      ),
    );
    await expect(args["onUpdate:open"]).not.toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(body.getByRole("combobox", { name: /^Task/ })).toHaveValue(
        "Fix login redirect",
      ),
    );
    await expect(body.getByRole("textbox", { name: /Duration/ })).toHaveValue(
      "00:00",
    );
    await expect(
      body.getByRole("textbox", { name: "Comment" }),
    ).not.toHaveTextContent("Wrote the checklist");
  },
};

export const ShowsTheServerError: Story = {
  args: {
    prefill: PREFILLED,
    save: fn(async () => {
      throw new Error("Timesheet is locked for this date.");
    }),
  },
  play: async ({ args }) => {
    await typeDuration("1");
    await typeComment("Blocked");
    const body = within(await dialog());
    await userEvent.click(body.getByRole("button", { name: "Save and close" }));
    await expect(
      await body.findByText("Timesheet is locked for this date."),
    ).toBeVisible();
    await expect(args["onUpdate:open"]).not.toHaveBeenCalledWith(false);
  },
};
