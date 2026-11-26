import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ErrorFallback from "./ErrorFallback.vue";
import {
  CustomFallback,
  DefaultFallback,
  HandlerError,
} from "./ErrorFallback.stories";

const meta = {
  title: "Components/ErrorFallback/Interactions",
  component: ErrorFallback,
  tags: ["interaction"],
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ShowsDefaultFallback: Story = {
  ...DefaultFallback,
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole("alert");
    await expect(alert).toHaveTextContent("Something went wrong");
    await expect(alert).toHaveTextContent(
      "Cannot read properties of undefined (reading 'name')",
    );
    await expect(
      within(canvasElement).queryByText("Content loaded"),
    ).toBeNull();
  },
};

export const CatchesErrorAndResets: Story = {
  ...CustomFallback,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Content loaded")).toBeVisible();
    await expect(canvas.queryByRole("alert")).toBeNull();

    await userEvent.click(
      canvas.getByRole("button", { name: "Break content" }),
    );
    const alert = await canvas.findByRole("alert");
    await expect(alert).toHaveTextContent("Failed to load tasks");
    await expect(canvas.queryByText("Content loaded")).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
    await expect(canvas.getByText("Content loaded")).toBeVisible();
  },
};

export const LeavesContentOnHandlerError: Story = {
  ...HandlerError,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await expect(await canvas.findByText("Logged: Save failed")).toBeVisible();
    await expect(canvas.queryByRole("alert")).toBeNull();
    await expect(canvas.getByText("Content loaded")).toBeVisible();
  },
};
