import {
  computed,
  inject,
  provide,
  reactive,
  watch,
  type InjectionKey,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { queryString } from "@/utils/query";
import { BUILT_IN_VIEWS } from "./constants";
import type { ProjectView } from "./types";

function createProjectViews() {
  const route = useRoute();
  const router = useRouter();

  const views = computed(() => BUILT_IN_VIEWS);
  const activeView = computed(() =>
    views.value.find((view) => view.name === queryString(route.query.view)),
  );

  /** Selects a view through the `view` query param. */
  function applyView(view: ProjectView, options: { replace?: boolean } = {}) {
    const location = {
      query: { ...route.query, view: view.name },
      hash: route.hash,
    };
    if (options.replace) router.replace(location);
    else router.push(location);
  }

  // No or an unknown `view` param opens the default view, as in the React page.
  watch(
    activeView,
    (view) => {
      if (view) return;
      const fallback =
        views.value.find((candidate) => candidate.default === 1) ??
        views.value[0];
      if (fallback) applyView(fallback, { replace: true });
    },
    { immediate: true },
  );

  return reactive({
    builtInViews: BUILT_IN_VIEWS,
    activeView,
    isKanban: computed(() => activeView.value?.type === "Custom"),
    applyView,
  });
}

export type ProjectViews = ReturnType<typeof createProjectViews>;

const projectViewsKey: InjectionKey<ProjectViews> = Symbol("projectViews");

/** Creates the page's views and shares them with its parts. */
export function provideProjectViews(): ProjectViews {
  const views = createProjectViews();
  provide(projectViewsKey, views);
  return views;
}

/** The views provided by the projects page. */
export function useProjectViews(): ProjectViews {
  const views = inject(projectViewsKey);
  if (!views) {
    throw new Error(
      "useProjectViews() needs provideProjectViews() in a parent",
    );
  }
  return views;
}
