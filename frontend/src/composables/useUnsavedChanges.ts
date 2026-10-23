import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  onScopeDispose,
  provide,
  shallowRef,
  type InjectionKey,
} from "vue";
import { useRouter } from "vue-router";

/** Something on the page that can hold unsaved edits, e.g. an open entry form. */
export interface UnsavedChangesSource {
  hasUnsavedChanges: () => boolean;
  /** Saves; runs `onSaved` once the save has succeeded. */
  saveChanges: (onSaved?: () => void) => void;
  discardChanges: () => void;
}

type Pending =
  | { kind: "action"; action: () => void }
  | { kind: "navigation"; resolve: (proceed: boolean) => void };

function createUnsavedChanges() {
  const source = shallowRef<UnsavedChangesSource | null>(null);
  const pending = shallowRef<Pending | null>(null);

  const hasUnsavedChanges = () => source.value?.hasUnsavedChanges() ?? false;

  function settle(proceed: boolean) {
    const current = pending.value;
    pending.value = null;
    if (current?.kind === "navigation") current.resolve(proceed);
    return current;
  }

  return {
    /** Whether the Save Changes dialog is asking what to do. */
    dialogOpen: computed(() => pending.value !== null),

    /** Registers the page's source of unsaved edits; returns its unregister. */
    registerSource(next: UnsavedChangesSource) {
      source.value = next;
      return () => {
        if (source.value === next) source.value = null;
      };
    },

    /**
     * Runs `action` now, or once the user discards or saves their changes when there
     * are unsaved ones.
     */
    requestGuardedAction(action: () => void = () => {}) {
      if (!hasUnsavedChanges()) {
        action();
        return;
      }
      pending.value = { kind: "action", action };
    },

    /** Asks before a navigation; resolves whether it may go ahead. */
    confirmNavigation(): Promise<boolean> | true {
      if (!hasUnsavedChanges()) return true;
      settle(false);
      return new Promise((resolve) => {
        pending.value = { kind: "navigation", resolve };
      });
    },

    hasUnsavedChanges,

    /** The dialog's Keep Editing (or close): nothing happens. */
    keepEditing() {
      settle(false);
    },

    /** The dialog's Discard Changes: drops the edits, then goes ahead. */
    discardChanges() {
      source.value?.discardChanges();
      const current = settle(true);
      if (current?.kind === "action") current.action();
    },

    /**
     * The dialog's Save Changes: saves, then runs a waiting action once saved. A
     * blocked navigation is cancelled, so the user stays to see the save.
     */
    saveChanges() {
      const current = settle(false);
      source.value?.saveChanges(
        current?.kind === "action" ? current.action : undefined,
      );
    },
  };
}

export type UnsavedChanges = ReturnType<typeof createUnsavedChanges>;

const unsavedChangesKey: InjectionKey<UnsavedChanges> =
  Symbol("unsavedChanges");

/**
 * Guards a page against losing unsaved edits, as the React pages do: while the
 * registered source has changes, any navigation (including a query change) and
 * guarded actions wait on the Save Changes dialog, and closing or reloading the tab
 * asks the browser's confirmation. Render `UnsavedChangesDialog` with the result.
 */
export function provideUnsavedChanges(): UnsavedChanges {
  const unsaved = createUnsavedChanges();
  const router = useRouter();
  provide(unsavedChangesKey, unsaved);

  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (!unsaved.hasUnsavedChanges()) return;
    event.preventDefault();
    // Older browsers only ask when returnValue is set.
    event.returnValue = "";
  }

  let removeGuard: (() => void) | undefined;
  onMounted(() => {
    removeGuard = router.beforeEach(() => unsaved.confirmNavigation());
    window.addEventListener("beforeunload", onBeforeUnload);
  });
  onBeforeUnmount(() => {
    removeGuard?.();
    window.removeEventListener("beforeunload", onBeforeUnload);
    unsaved.keepEditing();
  });

  return unsaved;
}

/** The unsaved-changes guard provided by the page. */
export function useUnsavedChanges(): UnsavedChanges {
  const unsaved = inject(unsavedChangesKey);
  if (!unsaved) {
    throw new Error(
      "useUnsavedChanges() needs provideUnsavedChanges() in a parent",
    );
  }
  return unsaved;
}

/** Registers `source` with the page's guard while the calling component lives. */
export function useUnsavedChangesSource(source: UnsavedChangesSource) {
  const unregister = useUnsavedChanges().registerSource(source);
  onScopeDispose(unregister);
}
