/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";
import {
  AgentAlt,
  Call,
  Email,
  Link,
  RightChevron,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { AboutCustomer } from "../types";

export function CustomerHoverCard({ customer }: { customer: AboutCustomer }) {
  const detailRows: Array<{ icon: typeof Email; value?: string }> = [
    { icon: AgentAlt, value: customer.company },
    { icon: Email, value: customer.email },
    { icon: Call, value: customer.phone },
    { icon: Link, value: customer.linkedin },
  ];

  const hasDetails = detailRows.some((row) => row.value);

  return (
    <div className="flex w-64 flex-col gap-3 rounded-xl bg-surface-modal p-3 shadow-2xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            size="xl"
            shape="circle"
            image={customer.image}
            label={customer.name}
            alt={customer.name}
          />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-base font-medium text-ink-gray-7">
              {customer.name}
            </span>
            {customer.designation && (
              <span className="truncate text-sm font-light text-ink-gray-6">
                {customer.designation}
              </span>
            )}
          </div>
        </div>
        {customer.href && (
          <a
            href={customer.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${customer.name}`}
            className="shrink-0 text-ink-gray-6 hover:text-ink-gray-8"
            onClick={(event) => event.stopPropagation()}
          >
            <RightChevron className="size-4" />
          </a>
        )}
      </div>

      {hasDetails && (
        <>
          <div className="h-px w-full bg-outline-gray-1" />
          <div className="flex flex-col gap-2.5">
            {detailRows.map(({ icon: Icon, value }, idx) =>
              value ? (
                <div key={idx} className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-ink-gray-5" />
                  <span className="truncate text-sm font-light text-ink-gray-6">
                    {value}
                  </span>
                </div>
              ) : null,
            )}
          </div>
        </>
      )}
    </div>
  );
}
