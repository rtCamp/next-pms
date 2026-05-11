/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";
import { AgentAlt, Apps, Calendar, Code } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { formatProjectDate } from "@/lib/utils";

import { Dot } from "../list/cells/dot";
import type { EmployeeRef, Project } from "../types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="flex w-full cursor-pointer flex-col gap-2.5 rounded-2xl border border-outline-gray-modals bg-surface-white pb-3 shadow-sm">
      <div className="flex w-full items-center gap-2 rounded-t-2xl border-b border-outline-gray-1 px-3.5 py-3">
        <Dot risk={project.riskLevel} />
        <span className="min-w-0 flex-1 truncate text-base font-medium text-ink-gray-7">
          {project.name}
        </span>
      </div>
      <div className="flex w-full flex-col gap-3.5 px-4">
        <Row icon={<Calendar className="size-4 shrink-0 text-ink-gray-6" />}>
          {formatProjectDate(project.startDate)} -{" "}
          {formatProjectDate(project.endDate)}
        </Row>
        <Row icon={<AgentAlt className="size-4 shrink-0 text-ink-gray-6" />}>
          <EmployeeInline employee={project.projectManager} />
        </Row>
        <Row icon={<Code className="size-4 shrink-0 text-ink-gray-6" />}>
          <EmployeeInline employee={project.leadEngineer} />
        </Row>
        <Row icon={<Apps className="size-4 shrink-0 text-ink-gray-6" />}>
          {project.type}
        </Row>
      </div>
    </div>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      {icon}
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-base text-ink-gray-6">
        {children}
      </span>
    </div>
  );
}

function EmployeeInline({ employee }: { employee: EmployeeRef }) {
  return (
    <>
      <Avatar
        size="xs"
        shape="circle"
        image={employee.avatar}
        label={employee.initials}
      />
      <span className="truncate">{employee.name}</span>
    </>
  );
}
