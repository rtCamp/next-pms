import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import FilterLinkValue from "./FilterLinkValue.vue";
import {
  EMPLOYEE_FIELD,
  EMPLOYEES,
  USER_FIELD,
  USERS,
} from "./FilterLinkValue.fixtures";

const requests: URL[] = [];

const meta = {
  title: "Components/Filter/FilterLinkValue/Interactions",
  component: FilterLinkValue,
  tags: ["interaction"],
  parameters: {
    a11y: {
      // frappe-ui's closed Combobox points aria-controls at a listbox reka-ui
      // hasn't rendered yet.
      options: { rules: { "aria-valid-attr-value": { enabled: false } } },
    },
  },
  args: {
    field: USER_FIELD,
    value: null,
    setValue: fn(),
    disabled: false,
  },
  beforeEach: () => {
    requests.length = 0;
    const original = window.fetch;
    window.fetch = async (input, init) => {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        window.location.origin,
      );
      if (url.pathname.includes("frappe.client.get_list")) {
        requests.push(url);
        return Response.json({ data: USERS });
      }
      if (url.pathname.includes("get_employee_list")) {
        requests.push(url);
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

/** Picking an option sets the value with its label. */
export const SelectsOption: Story = {
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: "Value" }));
    await userEvent.click(
      await screen.findByRole("option", { name: "Jane Smith" }),
    );
    await expect(args.setValue).toHaveBeenCalledWith(
      "jane@example.com",
      "Jane Smith",
    );
  },
};

/** A custom method gets the search as `employee_name`; the value is the value field. */
export const SearchesCustomMethod: Story = {
  args: { field: EMPLOYEE_FIELD },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("combobox", { name: "Value" });
    await userEvent.type(input, "Ravi");
    await waitFor(() =>
      expect(
        requests.some(
          (url) => url.searchParams.get("employee_name") === "Ravi",
        ),
      ).toBe(true),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Ravi Kumar" }),
    );
    await expect(args.setValue).toHaveBeenCalledWith(
      "ravi@example.com",
      "Ravi Kumar",
    );
  },
};
