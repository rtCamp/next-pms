/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";
import { mergeClassNames as cn } from "@next-pms/design-system";
import {
  formatRelativeTimeShort,
  stripTags,
} from "@next-pms/design-system/utils";
import { Avatar, Badge } from "@rtcamp/frappe-ui-react";
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import { EmailBody } from "./emailBody";
import type { Email } from "./types";

type EmailCardProps = {
  email: Email;
  defaultExpanded?: boolean;
  isLast?: boolean;
};

export function EmailCard({
  email,
  defaultExpanded = false,
  isLast = false,
}: EmailCardProps) {
  const toList = email.to.join(", ");
  const emailDate = new Date(email.sentAt.replace(" ", "T"));
  const timeString = format(emailDate, "h:mm a");
  const relativeDate = formatRelativeTimeShort(email.sentAt, new Date(), true);
  const previewText = stripTags(email.body);

  return (
    <Accordion.Root defaultValue={defaultExpanded ? ["email"] : []}>
      <Accordion.Item value="email" className="group">
        {/* Collapsed view - hidden when open */}
        <div className="pb-5 mt-px group-data-open:hidden">
          <Accordion.Trigger className="w-full text-left flex items-center gap-3 rounded-md shadow bg-surface-cards px-3 py-2.5 cursor-pointer">
            <div className="shrink-0">
              <Avatar
                size="xl"
                shape="circle"
                label={email.sender.name}
                image={email.sender.image}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 truncate min-w-0">
                  <span className="font-medium text-base text-ink-gray-9 shrink-0">
                    {email.sender.name}
                  </span>
                  <span className="hidden sm:block text-sm text-ink-gray-5 truncate">
                    &lt;{email.sender.email}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={email.status} />
                  <span className="text-sm text-ink-gray-5">{timeString}</span>
                </div>
              </div>
              <p className="text-sm text-ink-gray-5 truncate mt-0.5">
                {previewText}
              </p>
            </div>
          </Accordion.Trigger>
        </div>

        {/* Expanded view - hidden when closed */}
        <div className="hidden group-data-open:grid grid-cols-[30px_minmax(auto,1fr)] gap-2 sm:gap-4">
          <div
            className={cn(
              "z-0 relative flex justify-center before:absolute before:left-[50%] before:-z-1 before:top-0 before:border-l before:border-outline-gray-modals",
              isLast ? "before:h-9" : "before:h-full",
            )}
          >
            <div className="flex h-7 w-7 items-center justify-center bg-surface-white mt-2.5">
              <Avatar
                size="md"
                shape="circle"
                label={email.sender.name}
                image={email.sender.image}
              />
            </div>
          </div>

          <div className="pb-5 mt-px">
            <div className="flex flex-col rounded-md shadow bg-surface-cards px-3 py-1.5 text-base">
              <Accordion.Trigger className="w-full text-left py-2 flex flex-col gap-1 cursor-pointer">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate text-ink-gray-8">
                    <span>{email.sender.name}</span>
                    <span className="hidden sm:flex text-sm text-ink-gray-5">
                      &lt;{email.sender.email}&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={email.status} />
                    <span className="text-sm text-ink-gray-5">
                      {relativeDate}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-base leading-5 text-ink-gray-8">
                  <div>{email.subject}</div>
                  <div>
                    <span className="mr-1 text-ink-gray-5">To:</span>
                    <span>{toList}</span>
                    {email.cc && email.cc.length > 0 && (
                      <>
                        {"  "}
                        <span className="mr-1 text-ink-gray-5">CC:</span>
                        <span>{email.cc.join(", ")}</span>
                      </>
                    )}
                  </div>
                </div>
              </Accordion.Trigger>

              <Accordion.Panel>
                {/* Separator */}
                <div className="border-0 border-t mt-1 mb-1 border-outline-gray-modals" />

                <EmailBody html={email.body} />
              </Accordion.Panel>
            </div>
          </div>
        </div>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isSent = status === "Sent";

  if (!isSent) {
    return null;
  }

  return (
    <Badge
      variant="solid"
      size="sm"
      className="bg-surface-green-2 text-ink-green-3"
    >
      Sent
    </Badge>
  );
}
