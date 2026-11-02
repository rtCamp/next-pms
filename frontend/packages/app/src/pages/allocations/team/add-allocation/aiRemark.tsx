/**
 * External dependencies.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";

interface AiRemarkProps {
  remark: string;
}

export function AiRemark({ remark }: AiRemarkProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = textRef.current;

    if (!element || expanded) {
      return;
    }

    setIsOverflowing(element.scrollHeight > element.clientHeight);
  }, [remark, expanded]);

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-surface-amber-1 px-3 py-2 text-left">
      <span className="text-xs font-medium text-ink-amber-4">AI remark</span>
      <p
        ref={textRef}
        className={cn(
          "whitespace-pre-line break-words text-sm text-ink-gray-7",
          expanded ? "max-h-48 overflow-y-auto" : "line-clamp-4",
        )}
      >
        {remark}
      </p>
      {(isOverflowing || expanded) && (
        <button
          type="button"
          className="self-start text-xs font-medium text-ink-amber-4 hover:underline"
          onClick={() => setExpanded((previous) => !previous)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
