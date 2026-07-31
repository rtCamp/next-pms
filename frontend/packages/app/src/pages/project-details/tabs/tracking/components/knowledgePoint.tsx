/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";

type KnowledgePointProps = {
  title: string;
  value: string;
  href?: string;
};

const CARD_CLASSNAME =
  "flex h-20 flex-1 min-w-0 flex-col justify-between rounded-xl border border-outline-gray-1 bg-surface-cards p-3";

export function KnowledgePoint({ title, value, href }: KnowledgePointProps) {
  const content = (
    <>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate text-base font-normal text-ink-gray-5">
          {title}
        </span>
      </div>
      <span className="truncate text-xl font-medium text-ink-gray-8">
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          CARD_CLASSNAME,
          "cursor-pointer transition-colors hover:border-outline-gray-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3",
        )}
      >
        {content}
      </a>
    );
  }

  return <div className={CARD_CLASSNAME}>{content}</div>;
}
