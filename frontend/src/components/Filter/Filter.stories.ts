import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { computed, ref } from "vue";
import { Combobox, TextInput } from "frappe-ui";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import Filter from "./Filter.vue";
import type { FilterCondition, FilterField } from "./types";
import {
  FIELDS,
  LINK_RECORDS,
  MULTIPLE_CONDITIONS,
  PROJECT_CONDITION,
} from "./Filter.fixtures";

function useModelValue(
  args: { modelValue?: FilterCondition[] },
  updateArgs: ReturnType<typeof useArgs>[1],
) {
  const setValue = (modelValue: FilterCondition[]) => {
    // `updateArgs` syncs Controls; story tests only see the args write.
    Object.assign(args, { modelValue });
    updateArgs({ modelValue });
  };
  return { setValue };
}

function linkOptions(field: FilterField) {
  const link = field.link!;
  const labelField = link.labelField ?? "name";
  const valueField = link.valueField ?? "name";
  return (LINK_RECORDS[link.doctype] ?? []).map((r) => ({
    label: r[labelField] ?? r[valueField],
    value: r[valueField],
  }));
}

const meta = {
  title: "Components/Filter",
  component: Filter,
  tags: ["autodocs"],
  parameters: { docs: { story: { height: "400px" } } },
  args: {
    fields: FIELDS,
    "onUpdate:modelValue": fn(),
    "onUpdate:open": fn(),
    onClearAll: fn(),
  },
  argTypes: {
    side: { control: "select", options: ["top", "right", "bottom", "left"] },
    align: { control: "select", options: ["start", "center", "end"] },
  },
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { Filter },
      setup: () => ({ args, ...useModelValue(args, updateArgs) }),
      template: `
        <div class="flex justify-center">
          <Filter v-bind="args" @update:model-value="setValue" />
        </div>
      `,
    };
  },
} satisfies Meta<typeof Filter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInitialFilters: Story = {
  args: { modelValue: [PROJECT_CONDITION] },
};

export const MultipleFilters: Story = {
  args: { modelValue: MULTIPLE_CONDITIONS },
};

export const WithoutCount: Story = {
  args: { showCount: false, modelValue: [PROJECT_CONDITION] },
};

export const LimitedFilters: Story = {
  args: { maxFilters: 3 },
};

export const SimpleFields: Story = {
  args: {
    fields: [
      { name: "name", label: "Name", type: "string" },
      { name: "email", label: "Email", type: "string" },
      { name: "age", label: "Age", type: "number" },
    ],
  },
};

export const DefaultOpen: Story = {
  args: { defaultOpen: true },
};

export const WithExternalFilters: Story = {
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { Filter, TextInput },
      setup: () => {
        const search = ref("");
        const external = computed(() => (search.value ? 1 : 0));
        return { args, search, external, ...useModelValue(args, updateArgs) };
      },
      template: `
      <div class="flex items-center justify-center gap-2">
        <TextInput v-model="search" placeholder="Search" aria-label="Search" />
        <Filter
          v-bind="args"
          :external-filter-count="external"
          @update:model-value="setValue"
          @clear-all="search = ''"
        />
      </div>
    `,
    };
  },
};

export const LinkField: Story = {
  render: (args) => {
    const [, updateArgs] = useArgs();
    return {
      components: { Filter, Combobox },
      setup: () => ({
        args,
        ...useModelValue(args, updateArgs),
        linkOptions,
        labelOf: (field: FilterField, v: unknown) =>
          linkOptions(field).find((o) => o.value === v)?.label,
      }),
      template: `
      <div class="flex justify-center">
        <Filter v-bind="args" @update:model-value="setValue">
          <template #link-value="{ field, value, setValue, disabled }">
            <Combobox
              class="min-w-35"
              aria-label="Value"
              placeholder="Value"
              :options="linkOptions(field)"
              :model-value="value"
              :disabled="disabled"
              @update:model-value="(v) => setValue(v == null ? null : String(v), labelOf(field, v))"
            />
          </template>
        </Filter>
      </div>
    `,
    };
  },
};
