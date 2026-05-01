/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { AboutCustomer } from "./types";

function handleLinkClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  href?: string,
) {
  if (!href) {
    event.preventDefault();
  }
}

export function CustomerRow({ customer }: { customer: AboutCustomer }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Avatar size="sm" label={customer.name} alt={customer.name} />
        <span className="flex-1 truncate text-base font-medium text-ink-gray-7">
          {customer.name}
        </span>
      </div>
      <a
        href={customer.href ?? "#"}
        onClick={(event) => handleLinkClick(event, customer.href)}
        target={customer.href ? "_blank" : undefined}
        rel={customer.href ? "noreferrer noopener" : undefined}
        aria-label={`Open ${customer.name}`}
        className="text-ink-gray-7 hover:text-ink-gray-8"
      >
        <ArrowUpRight aria-hidden className="size-4" />
      </a>
    </div>
  );
}
