import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, within } from "storybook/test";
import RichText from "./RichText.vue";
import visual from "./RichText.stories";
import { CODE, TWO_PARAGRAPHS, UNSAFE } from "./RichText.fixtures";

const meta = {
  ...visual,
  title: "Components/RichText/Interactions",
  tags: ["interaction"],
} satisfies Meta<typeof RichText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const KeepsMentionsAndLinks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("@Priya Shah")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "spec" })).toHaveAttribute(
      "href",
      "https://example.com/spec",
    );
    await expect(canvas.queryByRole("textbox")).toBeNull();
  },
};

export const StripsUnsafeMarkup: Story = {
  args: { content: UNSAFE },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Hello")).toBeVisible();
    await expect(canvas.getByText("World")).not.toHaveAttribute("onclick");
    await expect(canvasElement.querySelector("script")).toBeNull();
    await expect(canvas.getByText("Open")).not.toHaveAttribute(
      "href",
      "javascript:alert(1)",
    );
  },
};

export const ShowsCode: Story = {
  args: { content: CODE },
  play: async ({ canvasElement }) => {
    const code = within(canvasElement)
      .getByText(/console/)
      .closest("code");
    await expect(code).toHaveTextContent(
      "const total = rows.reduce((sum, row) => sum + row.hours, 0);",
    );
  },
};

export const CopiesOneLinePerBlock: Story = {
  args: { content: TWO_PARAGRAPHS },
  play: async ({ canvasElement }) => {
    const first = within(canvasElement).getByText("First line");
    const second = within(canvasElement).getByText("Second line");
    const range = document.createRange();
    range.setStart(first.firstChild!, 0);
    range.setEnd(second.firstChild!, "Second line".length);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const clipboardData = new DataTransfer();
    first.dispatchEvent(
      new ClipboardEvent("copy", { clipboardData, bubbles: true }),
    );
    await expect(clipboardData.getData("text/plain")).toBe(
      "First line\nSecond line",
    );
  },
};
