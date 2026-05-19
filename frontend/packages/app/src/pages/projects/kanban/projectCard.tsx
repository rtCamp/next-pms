/**
 * External dependencies.
 */
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@rtcamp/frappe-ui-react";
import { AgentAlt, Apps, Calendar, Code } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { formatProjectDate, toKebabCase } from "@/lib/utils";

import { Dot } from "../list/cells/dot";
import type { RagStatus } from "../types";
import { CLICK_DRAG_THRESHOLD_PX } from "./constants";
import type { Employee, KanbanProjectItem } from "./types";

export function ProjectCard({ project }: { project: KanbanProjectItem }) {
  const navigate = useNavigate();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const dateRange = [project.start_date, project.end_date]
    .map((d) => (d ? formatProjectDate(d) : null))
    .filter(Boolean)
    .join(" - ");

  return (
    <div
      role="link"
      tabIndex={0}
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.hypot(dx, dy) <= CLICK_DRAG_THRESHOLD_PX) {
          navigate(`${ROUTES.project}/${project.name}`);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`${ROUTES.project}/${project.name}`);
        }
      }}
      className="flex w-full cursor-pointer flex-col gap-2.5 rounded-2xl border border-outline-gray-modals bg-surface-white pb-3 shadow-sm hover:bg-surface-gray-2 focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3"
    >
      <div className="flex w-full items-center gap-2 rounded-t-2xl border-b border-outline-gray-1 px-3.5 py-3">
        <Dot risk={toKebabCase(project.rag_status) as RagStatus} />
        <span className="min-w-0 flex-1 truncate text-base font-medium text-ink-gray-7">
          {project.project_name}
        </span>
      </div>
      <div className="flex w-full flex-col gap-3.5 px-4">
        <Row icon={<Calendar className="size-4 shrink-0 text-ink-gray-6" />}>
          {dateRange || "N/A"}
        </Row>
        <Row icon={<AgentAlt className="size-4 shrink-0 text-ink-gray-6" />}>
          <EmployeeInline employee={project.project_manager} />
        </Row>
        <Row icon={<Code className="size-4 shrink-0 text-ink-gray-6" />}>
          <EmployeeInline employee={project.engineering_manager} />
        </Row>
        <Row icon={<Apps className="size-4 shrink-0 text-ink-gray-6" />}>
          {project.billing_type ?? "N/A"}
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

function EmployeeInline({ employee }: { employee: Employee | null }) {
  if (!employee) {
    return <span className="truncate">N/A</span>;
  }
  return (
    <>
      <Avatar
        size="xs"
        shape="circle"
        image={employee.image ?? undefined}
        label={employee.full_name}
      />
      <span className="truncate">{employee.full_name}</span>
    </>
  );
}
