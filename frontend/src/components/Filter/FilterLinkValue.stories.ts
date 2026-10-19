import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { fn } from "storybook/test";
import FilterLinkValue from "./FilterLinkValue.vue";
import { EMPLOYEES, USER_FIELD, USERS } from "./FilterLinkValue.fixtures";

const meta = {
  title: "Components/Filter/FilterLinkValue",
  component: FilterLinkValue,
  tags: ["autodocs"],
  args: {
    field: USER_FIELD,
    value: null,
    setValue: fn(),
    disabled: false,
  },
  beforeEach: () => {
    const original = window.fetch;
    window.fetch = async (input, init) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.includes("frappe.client.get_list")) {
        return Response.json({ data: USERS });
      }
      if (url.includes("get_employee_list")) {
        return Response.json({ data: { data: EMPLOYEES } });
      }
      return original(input, init);
    };
    return () => {
      window.fetch = original;
    };
  },
} satisfies Meta<typeof FilterLinkValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

/** A selected value shows its label. */
export const WithValue: Story = {
  args: { value: "jane@example.com", displayLabel: "Jane Smith" },
};

/** Disabled until the condition has an operator. */
export const Disabled: Story = {
  args: { disabled: true },
};
