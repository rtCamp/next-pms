import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { computed, createApp, defineComponent, reactive, ref } from "vue";
import type { ProjectDoc } from "@/pages/project-details/types";
import { SIDEBAR_METHOD } from "./constants";
import type { ProjectSidebar } from "./types";
import {
  provideProjectSidebar,
  type ProjectSidebarState,
} from "./useProjectSidebar";

const fake = vi.hoisted(() => ({
  calls: new Map<string, FakeCall>(),
  toastError: (() => {}) as (message: string) => void,
}));

interface FakeCall {
  data: unknown;
  error: Error | null;
  loading: boolean;
  /** What the next `reload()` does; defaults to a successful empty sidebar. */
  respond: () => Promise<void>;
  reload: () => Promise<void>;
  submit: (params?: unknown) => Promise<unknown>;
}

vi.mock("frappe-ui", async (importOriginal) => {
  const { reactive } = await import("vue");
  return {
    ...(await importOriginal<typeof import("frappe-ui")>()),
    toast: { error: (message: string) => fake.toastError(message) },
    useCall: ({ url }: { url: string }) => {
      const call: FakeCall = reactive({
        data: null,
        error: null,
        loading: false,
        respond: async () => {},
        reload: () => call.respond(),
        submit: async () => null,
      }) as FakeCall;
      fake.calls.set(url, call);
      return call;
    },
  };
});

const doc = ref<Partial<ProjectDoc> | null>(null);
const setValue = vi.fn(async (values: Partial<ProjectDoc>) => {
  // Saving puts the new version in the doc store, as useDoc does.
  doc.value = { ...doc.value, ...values, modified: nextModified() };
});

vi.mock("@/pages/project-details/useProjectDetails", () => ({
  useProjectDetails: () => ({
    projectId: computed(() => "PROJ-1"),
    doc: computed(() => doc.value),
    setValue,
  }),
}));

let version = 0;
function nextModified() {
  version += 1;
  return `2026-10-21 10:00:0${version}`;
}

const emptySidebar: ProjectSidebar = {
  members: [],
  project_roles: {},
  customers: [],
} as unknown as ProjectSidebar;

let sidebarCall: FakeCall;
let reloads: Mock<() => Promise<void>>;
const toastError = vi.fn();
const mounted: { unmount: () => void }[] = [];

function mountSidebar(): ProjectSidebarState {
  let state!: ProjectSidebarState;
  const app = createApp(
    defineComponent({
      setup() {
        state = provideProjectSidebar();
        return () => null;
      },
    }),
  );
  app.mount(document.createElement("div"));
  mounted.push(app);
  sidebarCall = fake.calls.get(SIDEBAR_METHOD)!;
  reloads = vi.fn(async () => {
    sidebarCall.error = null;
    sidebarCall.data = emptySidebar;
  });
  sidebarCall.respond = () => reloads();
  return state;
}

/** Lets the watcher and the write queue run. */
function settle() {
  return new Promise((resolve) => setTimeout(resolve));
}

beforeEach(() => {
  version = 0;
  doc.value = reactive({ name: "PROJ-1", modified: nextModified() });
  fake.toastError = toastError;
  setValue.mockClear();
  toastError.mockClear();
});

afterEach(() => {
  while (mounted.length) mounted.pop()!.unmount();
  fake.calls.clear();
});

describe("useProjectSidebar", () => {
  it("refetches when the Project changes", async () => {
    mountSidebar();
    doc.value = { ...doc.value, modified: nextModified() };
    await settle();
    expect(reloads).toHaveBeenCalledOnce();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("shows a toast when that refetch fails", async () => {
    mountSidebar();
    reloads.mockImplementationOnce(async () => {
      sidebarCall.error = new Error("Sidebar is down");
    });
    doc.value = { ...doc.value, modified: nextModified() };
    await settle();
    expect(toastError).toHaveBeenCalledExactlyOnceWith("Sidebar is down");
  });

  it("refetches once per write, ignoring its own save", async () => {
    const { updateManager } = mountSidebar();
    await updateManager("project_manager", "pm@example.com");
    await settle();
    expect(setValue).toHaveBeenCalledOnce();
    expect(reloads).toHaveBeenCalledOnce();
  });

  it("refetches after the queue drains for a change that came in during the last refetch", async () => {
    const { addCustomer } = mountSidebar();
    let finishReload!: () => void;
    reloads.mockImplementationOnce(
      () => new Promise<void>((resolve) => (finishReload = resolve)),
    );
    const write = addCustomer("CONTACT-1");
    await settle();
    // A realtime update lands while the write's refetch is in flight.
    doc.value = { ...doc.value, modified: nextModified() };
    await settle();
    expect(reloads).toHaveBeenCalledOnce();

    finishReload();
    await write;
    expect(reloads).toHaveBeenCalledTimes(2);
  });
});
