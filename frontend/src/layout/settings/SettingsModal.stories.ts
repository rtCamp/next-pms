import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import SettingsModal from "./SettingsModal.vue";
import { fakeSettingsServer } from "./SettingsModal.fixtures";

const meta = {
  title: "Layout/SettingsModal",
  component: SettingsModal,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { roles: ["System Manager"] },
  beforeEach: fakeSettingsServer,
  render: (args) => ({
    components: { SettingsModal },
    setup: () => ({ args, open: ref(true) }),
    template: `<SettingsModal v-model:open="open" v-bind="args" />`,
  }),
} satisfies Meta<typeof SettingsModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A System Manager gets the user and the system tabs. */
export const SystemManager: Story = {};

/** Everyone else gets their own profile and timesheet settings only. */
export const Employee: Story = { args: { roles: ["Employee"] } };
