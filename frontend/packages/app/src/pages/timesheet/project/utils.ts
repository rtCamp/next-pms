/**
 * Internal dependencies.
 */
import type {
  ProjectTimesheetMember,
  ProjectTimesheetProject,
} from "@/components/timesheet-row/projectTimesheetRow";
import type {
  ProjectMemberPayload,
  ProjectMemberWeekPayload,
  ProjectWeekProjectPayload,
  ProjectWeekProjectsPayload,
} from "./types";

/**
 * Maps an API member payload to the shape the project rows render.
 */
export const toProjectMember = (
  member: ProjectMemberPayload,
): ProjectTimesheetMember => ({
  label: member.label,
  employee: member.employee,
  avatarUrl: member.avatar_url ?? undefined,
  tasks: member.tasks,
  holidays: member.holidays,
  leaves: member.leaves,
  workingHour: member.working_hour,
  workingFrequency: member.working_frequency,
  status: member.status,
});

/**
 * Maps an API project payload to the shape the project rows render.
 */
export const toProjectGroup = (
  project: ProjectWeekProjectPayload,
): ProjectTimesheetProject => ({
  project: project.project,
  projectName: project.project_name,
  members: project.members.map(toProjectMember),
});

/**
 * Upserts a member into a list of members, replacing any existing member with the same employee ID.
 */
const upsertMember = (
  members: ProjectMemberPayload[],
  employee: string,
  member: ProjectMemberPayload,
): ProjectMemberPayload[] =>
  members.some((existing) => existing.employee === employee)
    ? members.map((existing) =>
        existing.employee === employee ? member : existing,
      )
    : [...members, member];

/**
 * Applies a realtime member-week to one loaded week adds or replaces the employee
 * on the projects the payload lists, drops them from the projects it omits, and
 * removes any project left with no members.
 */
export const reconcileEmployeeWeek = (
  message: ProjectWeekProjectsPayload,
  { employee, projects: incoming }: ProjectMemberWeekPayload,
): ProjectWeekProjectsPayload => {
  const projects = message.projects
    .map((project) => {
      const incomingProject = incoming[project.project];
      const members = incomingProject
        ? upsertMember(project.members, employee, incomingProject.member)
        : project.members.filter((member) => member.employee !== employee);
      return { ...project, members };
    })
    .filter((project) => project.members.length > 0);

  return { ...message, projects };
};
