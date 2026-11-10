import type { Meta, StoryObj } from "@storybook/vue3-vite";
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";
import MotionPlayer from "./MotionPlayer.vue";
import visual from "./MotionPlayer.stories";
import {
  SUBMIT_WEEK_TITLE,
  loadFailing,
  loadSubmitWeek,
} from "./MotionPlayer.fixtures";

const meta = {
  title: "Components/MotionPlayer/Interactions",
  component: MotionPlayer,
  tags: ["interaction"],
  args: {
    load: loadSubmitWeek,
    label: SUBMIT_WEEK_TITLE,
    onExpand: fn(),
    onCollapse: fn(),
  },
  render: visual.render,
} satisfies Meta<typeof MotionPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

const nextFrames = async (count: number) => {
  for (let i = 0; i < count; i++)
    await new Promise((resolve) => requestAnimationFrame(resolve));
};

const progressOf = (slider: HTMLElement) =>
  Number(slider.getAttribute("aria-valuenow"));

const loaded = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  const slider = await canvas.findByRole("slider", {
    name: "Animation progress",
  });
  return { canvas, slider };
};

export const LoadsTheMotion: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const picture = canvas.getByRole("img", { name: SUBMIT_WEEK_TITLE });
    await waitFor(() =>
      expect(picture.closest("[aria-busy]")).toHaveAttribute(
        "aria-busy",
        "false",
      ),
    );
    await expect(picture).toHaveAttribute("data-motion", "submit-week");
    await expect(picture.childElementCount).toBeGreaterThan(0);
  },
};

export const PlaysAndPauses: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, slider } = await loaded(canvasElement);
    await waitFor(() => expect(progressOf(slider)).toBeGreaterThan(0));

    await userEvent.click(
      canvas.getByRole("button", { name: "Pause animation" }),
    );
    const pausedAt = progressOf(slider);
    await nextFrames(10);
    await expect(progressOf(slider)).toBe(pausedAt);

    await userEvent.click(
      canvas.getByRole("button", { name: "Play animation" }),
    );
    await waitFor(() => expect(progressOf(slider)).toBeGreaterThan(pausedAt));
  },
};

export const PausedFromOutside: Story = {
  args: { paused: true },
  play: async ({ canvasElement }) => {
    const { canvas, slider } = await loaded(canvasElement);
    await nextFrames(10);
    await expect(progressOf(slider)).toBe(0);
    // `paused` freezes playback without switching the controls to "Play".
    await expect(
      canvas.getByRole("button", { name: "Pause animation" }),
    ).toBeInTheDocument();
  },
};

export const ScrubsWithTheKeyboard: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, slider } = await loaded(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Pause animation" }),
    );

    slider.focus();
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(progressOf(slider)).toBe(100));
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(progressOf(slider)).toBe(95));
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(progressOf(slider)).toBe(0));
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(progressOf(slider)).toBe(5));
  },
};

export const ScrubsWithThePointer: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, slider } = await loaded(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Pause animation" }),
    );

    const { left, width, top, height } = slider.getBoundingClientRect();
    await fireEvent.pointerDown(slider, {
      pointerId: 1,
      clientX: left + width / 2,
      clientY: top + height / 2,
    });
    await waitFor(() => expect(progressOf(slider)).toBe(50));
  },
};

export const ReplaysFromTheStart: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, slider } = await loaded(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Pause animation" }),
    );
    slider.focus();
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(progressOf(slider)).toBe(100));

    await userEvent.click(
      canvas.getByRole("button", { name: "Replay from the start" }),
    );
    await expect(
      canvas.getByRole("button", { name: "Pause animation" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(progressOf(slider)).toBeLessThan(50));
  },
};

export const Expands: Story = {
  args: { expandable: true },
  play: async ({ args, canvasElement }) => {
    const { canvas } = await loaded(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: "Shrink animation" }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Enlarge animation" }),
    );
    await expect(args.onExpand).toHaveBeenCalledOnce();
  },
};

export const Collapses: Story = {
  args: { collapsible: true },
  play: async ({ args, canvasElement }) => {
    const { canvas } = await loaded(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: "Enlarge animation" }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Shrink animation" }),
    );
    await expect(args.onCollapse).toHaveBeenCalledOnce();
  },
};

export const HidesWhenTheMotionFailsToLoad: Story = {
  args: { load: loadFailing },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.queryByRole("img", { name: SUBMIT_WEEK_TITLE })).toBeNull(),
    );
  },
};
