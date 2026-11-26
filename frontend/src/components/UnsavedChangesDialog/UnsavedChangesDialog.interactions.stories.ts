import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import {
  provideUnsavedChanges,
  useUnsavedChanges,
  useUnsavedChangesSource,
} from "@/composables/useUnsavedChanges";
import UnsavedChangesDialog from "./UnsavedChangesDialog.vue";
import visual from "./UnsavedChangesDialog.stories";

const meta = {
  ...visual,
  title: "Components/UnsavedChangesDialog/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof UnsavedChangesDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const dialog = () => screen.findByRole("dialog", { name: "Save Changes" });

export const DiscardEmits: Story = {
  play: async ({ args }) => {
    await dialog();
    await userEvent.click(
      screen.getByRole("button", { name: "Discard Changes" }),
    );
    await expect(args.onDiscard).toHaveBeenCalledTimes(1);
  },
};

export const SaveEmits: Story = {
  play: async ({ args }) => {
    await dialog();
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await expect(args.onSave).toHaveBeenCalledTimes(1);
  },
};

export const EscapeKeepsEditing: Story = {
  play: async ({ args }) => {
    await dialog();
    await userEvent.keyboard("{Escape}");
    await expect(args.onKeepEditing).toHaveBeenCalledTimes(1);
    await expect(args["onUpdate:open"]).toHaveBeenCalledWith(false);
  },
};

const save = fn();
const discard = fn();
const action = fn();

// An editor registered with the guard, and the page that provides it: the guard
// is injected, so the two can't be one component.
// eslint-disable-next-line vue/one-component-per-file -- see above
const Editor = defineComponent({
  setup() {
    const dirty = ref(false);
    const unsaved = useUnsavedChanges();
    useUnsavedChangesSource({
      hasUnsavedChanges: () => dirty.value,
      saveChanges: (onSaved) => {
        save();
        dirty.value = false;
        onSaved?.();
      },
      discardChanges: () => {
        discard();
        dirty.value = false;
      },
    });
    return { dirty, unsaved, action };
  },
  template: `
    <div class="flex gap-2">
      <button type="button" @click="dirty = true">Edit</button>
      <button type="button" @click="unsaved.requestGuardedAction(action)">
        Run action
      </button>
      <span>{{ dirty ? "Unsaved" : "Saved" }}</span>
    </div>
  `,
});

let leaves = 0;

// eslint-disable-next-line vue/one-component-per-file -- see Editor
const Page = defineComponent({
  components: { Editor, UnsavedChangesDialog },
  setup() {
    const unsaved = provideUnsavedChanges();
    const router = useRouter();
    const navigated = ref("");
    async function leave() {
      const failure = await router.push(`/elsewhere-${++leaves}`);
      navigated.value = failure ? "Stayed" : "Left";
    }
    return { unsaved, leave, navigated };
  },
  template: `
    <div class="flex flex-col gap-2">
      <Editor />
      <button type="button" @click="leave">Leave page</button>
      <span>{{ navigated }}</span>
      <UnsavedChangesDialog
        :open="unsaved.dialogOpen.value"
        @keep-editing="unsaved.keepEditing()"
        @discard="unsaved.discardChanges()"
        @save="unsaved.saveChanges()"
      />
    </div>
  `,
});

const guarded: Story = {
  render: () => ({ components: { Page }, template: `<Page />` }),
  beforeEach: () => {
    save.mockClear();
    discard.mockClear();
    action.mockClear();
  },
};

export const CleanActionRunsAtOnce: Story = {
  ...guarded,
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Run action" }));
    await expect(action).toHaveBeenCalledTimes(1);
    await expect(screen.queryByRole("dialog")).toBeNull();
  },
};

export const DirtyActionWaitsForDiscard: Story = {
  ...guarded,
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Run action" }));
    await dialog();
    await expect(action).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: "Discard Changes" }),
    );
    await expect(discard).toHaveBeenCalledTimes(1);
    await expect(action).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

export const SaveRunsActionOnceSaved: Story = {
  ...guarded,
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Run action" }));
    await dialog();
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await expect(save).toHaveBeenCalledTimes(1);
    await expect(action).toHaveBeenCalledTimes(1);
  },
};

export const KeepEditingDropsAction: Story = {
  ...guarded,
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Run action" }));
    await dialog();
    await userEvent.click(screen.getByRole("button", { name: "Keep Editing" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await expect(action).not.toHaveBeenCalled();
    await expect(screen.getByText("Unsaved")).toBeVisible();
  },
};

export const NavigationWaitsAndKeepEditingStays: Story = {
  ...guarded,
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave page" }));
    await dialog();
    await userEvent.click(screen.getByRole("button", { name: "Keep Editing" }));
    await expect(await screen.findByText("Stayed")).toBeVisible();
  },
};

export const NavigationGoesAfterDiscard: Story = {
  ...guarded,
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave page" }));
    await dialog();
    await userEvent.click(
      screen.getByRole("button", { name: "Discard Changes" }),
    );
    await expect(await screen.findByText("Left")).toBeVisible();
  },
};

export const NavigationSaveStaysOnPage: Story = {
  ...guarded,
  play: async () => {
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Leave page" }));
    await dialog();
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await expect(save).toHaveBeenCalledTimes(1);
    await expect(await screen.findByText("Stayed")).toBeVisible();
  },
};

export const ReloadAsksWhileDirty: Story = {
  ...guarded,
  play: async () => {
    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    await expect(clean.defaultPrevented).toBe(false);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    const dirty = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirty);
    await expect(dirty.defaultPrevented).toBe(true);
  },
};
