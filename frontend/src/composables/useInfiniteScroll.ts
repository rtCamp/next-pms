import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from "vue";

export interface InfiniteScrollOptions {
  /** The scroll area the rows scroll in. */
  root: Readonly<Ref<HTMLElement | null>>;
  /** An empty element after the last row. */
  sentinel: Readonly<Ref<HTMLElement | null>>;
  /** Number of rows loaded so far; a change means a page arrived. */
  count: () => number;
  /** Whether another page may be requested now, e.g. not loading and more to load. */
  canLoad: () => boolean;
  load: () => void;
}

/**
 * Loads the next page while the sentinel is within 200px of the bottom of the scroll
 * area. The observer only reports changes, so after each page the sentinel is observed
 * afresh: a page shorter than the area leaves it visible, and the next callback,
 * measured against the new rows, says whether another page is needed.
 */
export function useInfiniteScroll(options: InfiniteScrollOptions) {
  const visible = ref(false);
  let observer: IntersectionObserver | undefined;

  function observe() {
    if (!observer || observer.root !== options.root.value) {
      observer?.disconnect();
      observer = new IntersectionObserver(
        ([entry]) => (visible.value = Boolean(entry?.isIntersecting)),
        { root: options.root.value, rootMargin: "200px" },
      );
    }
    observer.disconnect();
    visible.value = false;
    if (options.sentinel.value) observer.observe(options.sentinel.value);
  }

  onMounted(observe);
  onBeforeUnmount(() => observer?.disconnect());

  watch(() => options.sentinel.value, observe);
  // Synchronous, so the stale "visible" is gone before the watcher below sees loading end.
  watch(
    () => options.count(),
    () => {
      visible.value = false;
      nextTick(observe);
    },
    { flush: "sync" },
  );
  watch(
    () => [visible.value, options.canLoad()] as const,
    ([isVisible, canLoad]) => {
      if (isVisible && canLoad) options.load();
    },
  );
}
