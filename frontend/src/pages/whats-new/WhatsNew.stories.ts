import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useWhatsNew } from "@/composables/useWhatsNew";
import WhatsNew from "./WhatsNew.vue";
import { fakeWhatsNewServer, RELEASE_NOTES } from "./WhatsNew.fixtures";

const meta = {
  title: "Pages/WhatsNew",
  component: WhatsNew,
  parameters: { layout: "fullscreen" },
  beforeEach: () => {
    const whatsNew = useWhatsNew();
    whatsNew.available = true;
    whatsNew.unseen = true;
    whatsNew.lastSeen = "2.13.0";
    return fakeWhatsNewServer();
  },
  render: () => ({
    components: { WhatsNew },
    template: `<div class="h-[640px] overflow-y-auto"><WhatsNew /></div>`,
  }),
} satisfies Meta<typeof WhatsNew>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The installed releases, newest first: the latest open, the older ones closed. */
export const Default: Story = {};

/** No release on this site has notes yet. */
export const Empty: Story = {
  beforeEach: () =>
    fakeWhatsNewServer({ notes: { ...RELEASE_NOTES, releases: [] } }),
};

/** The notes couldn't be loaded: an alert with Retry, never a blank page. */
export const LoadError: Story = {
  beforeEach: () => fakeWhatsNewServer({ failures: Infinity }),
};
