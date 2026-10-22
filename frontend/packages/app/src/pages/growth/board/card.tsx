/**
 * External dependencies.
 */
import { useRef } from "react";
import { Avatar, Tooltip } from "@rtcamp/frappe-ui-react";
import { Folder } from "@rtcamp/frappe-ui-react/icons";
import { Building2 } from "lucide-react";

/**
 * Internal dependencies.
 */
import { currencyFormat, formatProjectDate } from "@/lib/utils";
import { PriorityBadge } from "@/pages/project-details/tabs/growth/list/cells/priorityBadge";
import { CLICK_DRAG_THRESHOLD_PX, NO_CLIENT_LABEL } from "../constants";
import { usePipeline } from "../context";
import type { PipelineInitiative } from "../types";

interface PipelineCardProps {
  initiative: PipelineInitiative;
  compact?: boolean;
}

export function PipelineCard({ initiative, compact }: PipelineCardProps) {
  const clients = usePipeline((c) => c.state.clients);
  const users = usePipeline((c) => c.state.users);
  const currency = usePipeline((c) => c.state.currency);
  const openInitiative = usePipeline((c) => c.actions.openInitiative);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const clientName = initiative.customer
    ? (clients[initiative.customer]?.customer_name ?? initiative.customer)
    : NO_CLIENT_LABEL;
  const value = currencyFormat(currency).format(initiative.converted_outcome);
  const people = (
    [
      ["Owner", initiative.activity_owner],
      ["PM", initiative.project_manager],
    ] as const
  ).flatMap(([role, email]) => (email ? [{ role, email }] : []));

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
        if (
          start &&
          Math.hypot(e.clientX - start.x, e.clientY - start.y) <=
            CLICK_DRAG_THRESHOLD_PX
        ) {
          openInitiative(initiative);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openInitiative(initiative);
        }
      }}
      className="flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-outline-gray-modals bg-surface-white p-3 shadow-sm hover:bg-surface-gray-2 focus:outline-none focus-visible:ring focus-visible:ring-outline-gray-3"
    >
      <span className="text-base font-medium text-ink-gray-8 line-clamp-2 wrap-break-word">
        {initiative.activity}
      </span>
      {compact ? (
        <span className="truncate text-sm text-ink-gray-6">
          {clientName} · {value}
        </span>
      ) : (
        <>
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-ink-gray-6">
            <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{clientName}</span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-ink-gray-6">
            <Folder className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {initiative.project_name ?? "No project yet"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-base font-medium tabular-nums text-ink-gray-8">
              {value}
            </span>
            {initiative.client_priority && (
              <PriorityBadge priority={initiative.client_priority} />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {people.map(({ role, email }) => {
              const name = users[email]?.full_name ?? email;
              return (
                <Tooltip key={role} text={`${role}: ${name}`}>
                  <span>
                    <Avatar
                      size="xs"
                      shape="circle"
                      image={users[email]?.user_image ?? undefined}
                      label={name}
                    />
                  </span>
                </Tooltip>
              );
            })}
            <span className="flex-1" />
            <span className="text-sm text-ink-gray-5">
              {formatProjectDate(initiative.modified.slice(0, 10))}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
