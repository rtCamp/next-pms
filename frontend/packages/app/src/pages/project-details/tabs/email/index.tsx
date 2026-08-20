/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";
import { compareDesc, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { EmailCard } from "./emailCard";
import { useProjectEmails } from "./useProjectEmails";

export function EmailTab() {
  const { emails, isLoading } = useProjectEmails();

  if (isLoading) {
    return <Spinner isFull={true} />;
  }

  if (!emails.length) {
    return (
      <p className="py-6 text-center text-base text-ink-gray-5">
        No emails found.
      </p>
    );
  }

  const sorted = [...emails].sort((a, b) =>
    compareDesc(
      parseISO(a.sentAt.replace(" ", "T")),
      parseISO(b.sentAt.replace(" ", "T")),
    ),
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-ink-gray-7">Email</h2>
      <div className="flex flex-col">
        {sorted.map((email, index) => (
          <EmailCard
            key={email.id}
            email={email}
            defaultExpanded={index === 0}
            isLast={index === sorted.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
