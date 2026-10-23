import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ListUpdate } from "@/composables/useDoctypeListUpdates";
import { createOwnWrites, OWN_WRITE_ECHO_MS } from "./ownWrites";

const ME = "me@example.com";
const OTHER = "other@example.com";

const event = (name: string, user: string): ListUpdate => ({
  doctype: "ToDo",
  name,
  user,
});

function setup() {
  const onMissedUpdate = vi.fn();
  const writes = createOwnWrites({ userId: () => ME, onMissedUpdate });
  return { ...writes, onMissedUpdate };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("createOwnWrites", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("skips every event while a write is in flight", async () => {
    const { localWrite, isOwnEcho } = setup();
    const write = deferred<string>();
    const done = localWrite(
      () => write.promise,
      (name) => name,
    );

    expect(isOwnEcho(event("A", OTHER))).toBe(true);
    expect(isOwnEcho(event("B", ME))).toBe(true);

    write.resolve("A");
    await done;
    expect(isOwnEcho(event("B", OTHER))).toBe(false);
  });

  it("calls onMissedUpdate only when a write that skipped an event fails", async () => {
    const { localWrite, isOwnEcho, onMissedUpdate } = setup();

    const saved = deferred<string>();
    const ok = localWrite(
      () => saved.promise,
      (name) => name,
    );
    isOwnEcho(event("B", OTHER));
    saved.resolve("A");
    await ok;
    expect(onMissedUpdate).not.toHaveBeenCalled();

    const quiet = deferred<string>();
    const failsQuietly = localWrite(
      () => quiet.promise,
      (name) => name,
    );
    quiet.reject(new Error("Nope"));
    await expect(failsQuietly).rejects.toThrow("Nope");
    expect(onMissedUpdate).not.toHaveBeenCalled();

    const failed = deferred<string>();
    const fails = localWrite(
      () => failed.promise,
      (name) => name,
    );
    isOwnEcho(event("B", OTHER));
    failed.reject(new Error("Nope"));
    await expect(fails).rejects.toThrow("Nope");
    expect(onMissedUpdate).toHaveBeenCalledTimes(1);
  });

  it("skips the user's first event for each written name, once", async () => {
    const { localWrite, isOwnEcho } = setup();
    await localWrite(
      async () => "A",
      (name) => name,
    );
    await localWrite(
      async () => "B",
      (name) => name,
    );

    expect(isOwnEcho(event("A", OTHER))).toBe(false);
    expect(isOwnEcho(event("A", ME))).toBe(true);
    expect(isOwnEcho(event("A", ME))).toBe(false);
    expect(isOwnEcho(event("B", ME))).toBe(true);
    expect(isOwnEcho(event("C", ME))).toBe(false);
  });

  it("remembers nothing when the result names no document", async () => {
    const { localWrite, isOwnEcho } = setup();
    await localWrite(
      async () => null,
      () => undefined,
    );
    expect(isOwnEcho(event("A", ME))).toBe(false);
  });

  it("stops skipping a written name after OWN_WRITE_ECHO_MS", async () => {
    const { localWrite, isOwnEcho } = setup();
    await localWrite(
      async () => "A",
      (name) => name,
    );
    await localWrite(
      async () => "B",
      (name) => name,
    );

    vi.advanceTimersByTime(OWN_WRITE_ECHO_MS);
    expect(isOwnEcho(event("A", ME))).toBe(true);
    vi.advanceTimersByTime(1);
    expect(isOwnEcho(event("B", ME))).toBe(false);
  });
});
