import { computed, effectScope, reactive, watch } from "vue";
import { toast, useCall } from "frappe-ui";
import type { ProjectPhaseColor } from "@/components/PhaseIcon";
import { errorMessage } from "@/utils/errors";

/** A Project Phase record: the values `custom_project_phase` links to. */
export interface ProjectPhase {
  phase: string;
  color: ProjectPhaseColor | null;
  position: number;
}

let phasesCall: ReturnType<typeof createPhasesCall> | undefined;

interface KanbanColumnsResponse {
  columns: { key: string; color: ProjectPhaseColor | null; position: number }[];
}

// Detached, so the shared call outlives the component that first asks for it.
// Read from the kanban view's columns: every projects role may call it, while Project
// Phase itself isn't readable by all of them (Timesheet Manager).
function createPhasesCall() {
  return effectScope(true).run(() => {
    const call = useCall<
      KanbanColumnsResponse,
      Record<string, string | number>
    >({
      url: "/api/v2/method/next_pms.next_projects.api.project.get_projects_view",
      params: { view: "kanban", limit: 1 },
    });
    watch(
      () => call.error,
      (error) => error && toast.error(errorMessage(error)),
    );
    return call;
  })!;
}

/**
 * The Project Phase records in board order, loaded once and shared, for the kanban
 * columns, the phase filter and select, and the phase cell.
 */
export function useProjectPhases() {
  phasesCall ??= createPhasesCall();
  const call = phasesCall;
  const phases = computed<ProjectPhase[]>(() =>
    (call.data?.columns ?? []).map(({ key, color, position }) => ({
      phase: key,
      color,
      position,
    })),
  );

  return reactive({
    phases,
    loading: computed(() => call.loading),
    error: computed(() => call.error),
    /** The record for a phase name, if it is one. */
    phaseOf: (name: string | null | undefined) =>
      phases.value.find((phase) => phase.phase === name),
  });
}
