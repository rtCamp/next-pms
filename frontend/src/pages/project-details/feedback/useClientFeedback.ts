import { inject, provide, ref, type InjectionKey } from "vue";
import { dayjs } from "frappe-ui";
import { initialWindow } from "./feedback";
import type { MonthKey, TimelineWindow } from "./types";

function createClientFeedback() {
  const today = dayjs();
  return {
    /** The months the timeline covers; slides as the user scrolls to either end. */
    timelineWindow: ref<TimelineWindow>(initialWindow(today.toDate())),
    selectedMonth: ref<MonthKey>({ year: today.year(), month: today.month() }),
    /** The selected month's Customer Feedback; `null` when it has none. */
    selectedFeedbackId: ref<string | null>(null),
  };
}

export type ClientFeedback = ReturnType<typeof createClientFeedback>;

const clientFeedbackKey: InjectionKey<ClientFeedback> =
  Symbol("clientFeedback");

/**
 * The client view's timeline window and selected month, kept by the Feedback tab so
 * they survive a switch to the team view and back, as in React.
 */
export function provideClientFeedback(): ClientFeedback {
  const state = createClientFeedback();
  provide(clientFeedbackKey, state);
  return state;
}

export function useClientFeedback(): ClientFeedback {
  const state = inject(clientFeedbackKey);
  if (!state) {
    throw new Error(
      "useClientFeedback() needs provideClientFeedback() in a parent",
    );
  }
  return state;
}
