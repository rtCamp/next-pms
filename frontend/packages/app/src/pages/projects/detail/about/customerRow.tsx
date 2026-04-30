/**
 * External dependencies.
 */
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { ColorAvatar } from "./colorAvatar";
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
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          tabIndex={0}
          role="group"
          aria-label={`${customer.name}, ${customer.company}`}
          className="flex items-center gap-3 rounded-sm py-1.5 outline-none focus-visible:ring focus-visible:ring-outline-gray-3"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ColorAvatar
              initials={customer.initials}
              color={customer.avatarColor}
              alt={`${customer.name} avatar`}
            />
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
      </HoverCardTrigger>
      <HoverCardContent className="w-64 text-sm">
        <div className="flex items-center gap-2">
          <ColorAvatar
            initials={customer.initials}
            color={customer.avatarColor}
            alt=""
          />
          <span className="font-semibold text-ink-gray-8">{customer.name}</span>
        </div>
        <p className="mt-1 text-ink-gray-6">{customer.company}</p>
        <a
          href={`mailto:${customer.email}`}
          className="mt-2 block truncate text-ink-blue-3 hover:underline"
        >
          {customer.email}
        </a>
      </HoverCardContent>
    </HoverCard>
  );
}
