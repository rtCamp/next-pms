import type {
  ProjectMember,
  ProjectMemberWeekPayload,
  ProjectWeekProjectsPayload,
} from "./types";

function upsertMember(
  members: ProjectMember[],
  member: ProjectMember,
): ProjectMember[] {
  return members.some((current) => current.employee === member.employee)
    ? members.map((current) =>
        current.employee === member.employee ? member : current,
      )
    : [...members, member];
}

/**
 * The page with the employee added or replaced on the projects `payload` lists, dropped
 * from those it omits, and projects left without members removed.
 */
function reconcileEmployeeWeek(
  page: ProjectWeekProjectsPayload,
  { employee, projects: incoming }: ProjectMemberWeekPayload,
): ProjectWeekProjectsPayload {
  return {
    ...page,
    projects: page.projects
      .map((project) => {
        const incomingProject = incoming[project.project];
        return {
          ...project,
          members: incomingProject
            ? upsertMember(project.members, incomingProject.member)
            : project.members.filter((member) => member.employee !== employee),
        };
      })
      .filter((project) => project.members.length > 0),
  };
}

/**
 * The loaded pages with a realtime employee-week applied, or `null` when a project was
 * added or dropped, which shifts the paging, so the pages have to be reloaded.
 */
export function applyRealtimeToPages(
  pages: ProjectWeekProjectsPayload[],
  payload: ProjectMemberWeekPayload,
): ProjectWeekProjectsPayload[] | null {
  const loadedIds = new Set(
    pages.flatMap((page) => page.projects.map((project) => project.project)),
  );
  if (Object.keys(payload.projects).some((id) => !loadedIds.has(id))) {
    return null;
  }
  const nextPages = pages.map((page) => reconcileEmployeeWeek(page, payload));
  const droppedProject = nextPages.some(
    (page, index) => page.projects.length < pages[index].projects.length,
  );
  return droppedProject ? null : nextPages;
}
