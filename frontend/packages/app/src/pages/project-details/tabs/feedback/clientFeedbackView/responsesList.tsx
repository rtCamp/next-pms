/**
 * Internal dependencies.
 */
import type { ResponseItem } from "../types";

interface ResponsesListProps {
  responses: ResponseItem[];
}

export function ResponsesList({ responses }: ResponsesListProps) {
  if (responses.length === 0) {
    return (
      <p className="text-base text-ink-gray-5">
        No responses submitted for this month.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {responses.map((item, i) => (
        <div key={i} className="flex flex-col gap-1">
          <p className="text-base font-medium text-ink-gray-8">
            {item.question}
          </p>
          <p className="text-base leading-normal text-ink-gray-6">
            {item.answer}
          </p>
        </div>
      ))}
    </div>
  );
}
