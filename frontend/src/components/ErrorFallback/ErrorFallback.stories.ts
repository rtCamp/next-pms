import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { defineComponent, h, ref } from "vue";
import { Button } from "frappe-ui";
import ErrorFallback from "./ErrorFallback.vue";

const Bomb = defineComponent({
  name: "Bomb",
  props: { broken: Boolean, message: { type: String, default: "" } },
  setup(props) {
    return () => {
      if (props.broken) throw new Error(props.message);
      return h("p", { class: "text-base text-ink-gray-8" }, "Content loaded");
    };
  },
});

const meta = {
  title: "Components/ErrorFallback",
  component: ErrorFallback,
  tags: ["autodocs"],
  render: () => ({
    components: { ErrorFallback, Bomb },
    template: `
      <div class="h-32 w-80 rounded-4 border border-outline-gray-2">
        <ErrorFallback><Bomb /></ErrorFallback>
      </div>
    `,
  }),
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoError: Story = {};

export const DefaultFallback: Story = {
  render: () => ({
    components: { ErrorFallback, Bomb },
    template: `
      <div class="h-32 w-80 rounded-4 border border-outline-gray-2">
        <ErrorFallback>
          <Bomb broken message="Cannot read properties of undefined (reading 'name')" />
        </ErrorFallback>
      </div>
    `,
  }),
};

export const DefaultFallbackWithoutMessage: Story = {
  render: () => ({
    components: { ErrorFallback, Bomb },
    template: `
      <div class="h-32 w-80 rounded-4 border border-outline-gray-2">
        <ErrorFallback><Bomb broken /></ErrorFallback>
      </div>
    `,
  }),
};

const withCustomFallback = () => ({
  components: { ErrorFallback, Bomb, Button },
  setup() {
    const broken = ref(false);
    function retry(reset: () => void) {
      broken.value = false;
      reset();
    }
    return { broken, retry };
  },
  template: `
    <div class="flex w-80 flex-col gap-2">
      <Button label="Break content" @click="broken = true" />
      <div class="h-32 rounded-4 border border-outline-gray-2">
        <ErrorFallback>
          <Bomb :broken="broken" message="Failed to load tasks" />
          <template #fallback="{ error, reset }">
            <div role="alert" class="flex size-full flex-col items-center justify-center gap-2 p-2">
              <p class="text-sm text-ink-gray-7">Couldn't show this: {{ error.message }}</p>
              <Button label="Try again" @click="retry(reset)" />
            </div>
          </template>
        </ErrorFallback>
      </div>
    </div>
  `,
});

export const CustomFallback: Story = { render: withCustomFallback };
