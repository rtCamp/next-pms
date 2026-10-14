import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import ColumnSelector from "./ColumnSelector.vue";
import type { SelectorColumn } from "./types";
import {
  PINNED_FIRST_TWO,
  TICKET_COLUMNS,
  TICKET_FIELDS,
} from "./ColumnSelector.fixtures";

const meta = {
  title: "Components/ColumnSelector",
  component: ColumnSelector,
  tags: ["autodocs"],
  args: {
    modelValue: TICKET_COLUMNS,
    availableColumns: TICKET_FIELDS,
    "onUpdate:modelValue": fn(),
    onReset: fn(),
  },
  argTypes: {
    minColumns: { control: "number" },
    maxPinned: { control: "number" },
    side: { control: "select", options: ["top", "right", "bottom", "left"] },
    align: { control: "select", options: ["start", "center", "end"] },
  },
  render: (args, { initialArgs }) => {
    const [, updateArgs] = useArgs();
    // `updateArgs` syncs Controls; story tests only see the args write.
    const update = (modelValue: SelectorColumn[]) => {
      Object.assign(args, { modelValue });
      updateArgs({ modelValue });
    };
    return {
      components: { ColumnSelector },
      setup: () => ({
        args,
        update,
        // The component only emits `reset`; restoring the columns is the parent's job.
        reset: () => update(initialArgs.modelValue),
      }),
      template: `
        <div class="flex justify-center p-8">
          <ColumnSelector v-bind="args" @update:model-value="update" @reset="reset" />
        </div>
      `,
    };
  },
} satisfies Meta<typeof ColumnSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const french = {
  trigger: "Colonnes",
  addColumn: "Ajouter une colonne",
  search: "Rechercher une colonne",
  resetToDefault: "Réinitialiser",
  remove: "Supprimer la colonne",
  reorder: "Réordonner la colonne",
  reorderHint:
    "Espace pour saisir, flèches pour déplacer, Espace pour déposer, Échap pour annuler.",
  pin: "Épingler la colonne",
  unpin: "Désépingler la colonne",
  pinLimit: "Limite d'épinglage atteinte",
};

export const Default: Story = {
  args: { resettable: true },
};

export const IconOnlyTrigger: Story = {
  args: { ...Default.args, hideLabel: true },
};

export const AtMinimumColumns: Story = {
  args: { ...Default.args, modelValue: [TICKET_COLUMNS[0]] },
};

export const AllColumnsAdded: Story = {
  args: { ...Default.args, modelValue: TICKET_FIELDS },
};

export const WithoutReset: Story = {
  args: { resettable: false },
};

export const Pinnable: Story = {
  args: { ...Default.args, pinnable: true, modelValue: PINNED_FIRST_TWO },
};

export const PinLimitReached: Story = {
  args: { ...Pinnable.args, maxPinned: 2 },
};

export const NotReorderable: Story = {
  args: { ...Default.args, reorderable: false },
};

export const Disabled: Story = {
  args: { ...Default.args, disabled: true },
};

export const TranslatedLabels: Story = {
  args: { ...Default.args, labels: french },
};
