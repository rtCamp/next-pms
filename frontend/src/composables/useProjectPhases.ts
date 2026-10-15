import { computed, effectScope, reactive } from "vue";
import { useCall } from "frappe-ui";
import type { ProjectPhaseColor } from "@/components/PhaseIcon";

/** A Project Phase record: the values `custom_project_phase` links to. */
export interface ProjectPhase {
  phase: string;
  color: ProjectPhaseColor | null;
  position: number;
}

let phasesCall: ReturnType<typeof createPhasesCall> | undefined;

// Detached, so the shared call outlives the component that first asks for it.
function createPhasesCall() {
  return effectScope(true).run(() =>
    useCall<ProjectPhase[], Record<string, string | number>>({
      url: "/api/v2/method/frappe.client.get_list",
      params: {
        doctype: "Project Phase",
        fields: JSON.stringify(["phase", "color", "position"]),
        order_by: "position asc",
        limit_page_length: 0,
      },
    }),
  )!;
}

/**
 * The Project Phase records in board order, loaded once and shared, for the kanban
 * columns, the phase filter and select, and the phase cell.
 */
export function useProjectPhases() {
  phasesCall ??= createPhasesCall();
  const call = phasesCall;
  const phases = computed(() => call.data ?? []);

  return reactive({
    phases,
    loading: computed(() => call.loading),
    error: computed(() => call.error),
    /** The record for a phase name, if it is one. */
    phaseOf: (name: string | null | undefined) =>
      phases.value.find((phase) => phase.phase === name),
  });
}
