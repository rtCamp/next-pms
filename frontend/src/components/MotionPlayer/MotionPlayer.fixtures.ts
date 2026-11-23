import type { MotionLoader } from "./types";

export const SUBMIT_WEEK_TITLE = "Send a week for approval";

export const loadSubmitWeek: MotionLoader = () =>
  import("@/assets/motions/submit-week?motion");

export const loadForever: MotionLoader = () => new Promise(() => {});

export const loadFailing: MotionLoader = () =>
  Promise.reject(new Error("Motion chunk failed to load"));
