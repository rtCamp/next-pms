// Scales an explicit wait for slower machines. expect.timeout in the config
// only covers assertions, so waitFor/click timeouts need this to scale too.
const FACTOR = Number(
  process.env.TEST_TIMEOUT_FACTOR ?? (process.env.CI ? 3 : 2),
);

export const scaleTimeout = (ms) => Math.round(ms * FACTOR);
