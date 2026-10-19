import {
  computed,
  inject,
  provide,
  toValue,
  type InjectionKey,
  type MaybeRefOrGetter,
} from "vue";
import { useDoc } from "frappe-ui";
import { useDocUpdates } from "@/composables/useDocUpdates";
import type { ProjectDoc } from "./types";

function createProjectDetails(projectId: MaybeRefOrGetter<string>) {
  // staleOnError keeps the page on screen when a realtime reload fails.
  const project = useDoc<ProjectDoc>({
    doctype: "Project",
    name: projectId,
    staleOnError: true,
  });

  useDocUpdates("Project", projectId, (update) => {
    // Our own save already put this version in the doc store.
    if (update.modified && update.modified === project.doc?.modified) return;
    project.reload();
  });

  return {
    projectId: computed(() => toValue(projectId)),
    /** The Project, or `null` until it loads. */
    doc: computed(() => project.doc),
    loading: computed(() => project.loading),
    error: computed(() => project.error),
    reload: () => project.reload(),
    /** Saves `values` on the Project; rejects when the save fails. */
    setValue: (values: Partial<ProjectDoc>) => project.setValue.submit(values),
  };
}

export type ProjectDetails = ReturnType<typeof createProjectDetails>;

const projectDetailsKey: InjectionKey<ProjectDetails> =
  Symbol("projectDetails");

/**
 * Loads the Project, keeps it current through realtime `doc_update` events, and
 * provides it to the tabs, so none of them fetch the Project themselves.
 */
export function provideProjectDetails(
  projectId: MaybeRefOrGetter<string>,
): ProjectDetails {
  const details = createProjectDetails(projectId);
  provide(projectDetailsKey, details);
  return details;
}

/** The Project provided by the Project details page this component is on. */
export function useProjectDetails(): ProjectDetails {
  const details = inject(projectDetailsKey);
  if (!details) {
    throw new Error(
      "useProjectDetails() needs provideProjectDetails() in a parent",
    );
  }
  return details;
}
