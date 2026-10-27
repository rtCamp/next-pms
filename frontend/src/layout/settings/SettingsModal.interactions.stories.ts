import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import SettingsModal from "./SettingsModal.vue";
import { requests } from "./SettingsModal.fixtures";
import { Employee, SystemManager } from "./SettingsModal.stories";
import meta from "./SettingsModal.stories";

export default {
  ...meta,
  title: "Layout/SettingsModal/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof SettingsModal>;
type Story = StoryObj<typeof meta>;

const tabs = (name: string) => screen.getAllByRole("tab", { name });

/** Without a system role, the System Configuration tabs aren't there. */
export const UserTabsOnly: Story = {
  ...Employee,
  play: async () => {
    await screen.findByRole("tab", { name: "Profile" });
    await expect(tabs("Timesheets")).toHaveLength(1);
    await expect(
      screen.queryByRole("tab", { name: "Resource Management" }),
    ).toBeNull();
  },
};

/** The user's Timesheets tab saves their own setting through the PMS settings API. */
export const SavesUserSettings: Story = {
  ...SystemManager,
  play: async () => {
    await userEvent.click(
      (await screen.findAllByRole("tab", { name: "Timesheets" }))[0],
    );
    const panel = await screen.findByRole("tabpanel");
    const save = within(panel).getByRole("button", { name: "Save" });
    const weeks = await within(panel).findByLabelText(
      "Default Expanded Weeks in Timesheet View",
    );
    await waitFor(() => expect(weeks).toHaveValue(2));
    // Enabled before any edit, as in React.
    await expect(save).toBeEnabled();

    await userEvent.clear(weeks);
    await userEvent.type(weeks, "4");
    await userEvent.click(save);

    await waitFor(() =>
      expect(requests.at(-1)?.body).toEqual({
        settings: {
          auto_expand_weeks_by_default: 4,
          use_system_auto_expand_weeks: 0,
        },
      }),
    );
  },
};

/** A system tab sends only the fields that changed. */
export const SavesChangedSystemFields: Story = {
  ...SystemManager,
  play: async () => {
    await userEvent.click(
      (await screen.findAllByRole("tab", { name: "Timesheets" }))[1],
    );
    const panel = await screen.findByRole("tabpanel");
    const future = await within(panel).findByRole("checkbox", {
      name: "Allow Future Entries",
    });
    await userEvent.click(future);
    await userEvent.click(within(panel).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(requests.at(-1)?.body).toEqual({ allow_future_entries: 1 }),
    );
  },
};

/** Closing with unsaved edits asks first; Discard drops them and closes. */
export const AsksBeforeClosing: Story = {
  ...SystemManager,
  play: async () => {
    await userEvent.click(
      (await screen.findAllByRole("tab", { name: "Resource Management" }))[0],
    );
    const panel = await screen.findByRole("tabpanel");
    await userEvent.click(
      await within(panel).findByRole("checkbox", {
        name: "Send Missing Allocation Reminder",
      }),
    );

    // Edits survive switching tabs.
    await userEvent.click(screen.getByRole("tab", { name: "Profile" }));
    await userEvent.click(
      screen.getByRole("tab", { name: "Resource Management" }),
    );
    await expect(
      await screen.findByRole("checkbox", {
        name: "Send Missing Allocation Reminder",
      }),
    ).not.toBeChecked();

    await userEvent.keyboard("{Escape}");
    const prompt = await screen.findByRole("dialog", { name: "Save Changes" });
    // Still open behind the prompt, which hides it from the accessibility tree.
    await expect(
      screen.getByRole("tablist", { hidden: true }),
    ).toBeInTheDocument();

    await userEvent.click(
      within(prompt).getByRole("button", { name: "Discard Changes" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("tablist", { hidden: true })).toBeNull(),
    );
    await expect(requests).toHaveLength(0);
  },
};
