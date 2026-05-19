/**
 * External dependencies.
 */
import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/react";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "../../utils";

type DroppableProps = {
  id: string;
  header?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export function Droppable({
  id,
  header,
  className,
  style,
  children,
}: DroppableProps) {
  const { ref } = useDroppable({
    id,
    type: "column",
    accept: ["item"],
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div
      className={mergeClassNames("flex shrink-0 flex-col gap-3", className)}
      style={style}
    >
      {header}
      <div ref={ref} className="flex flex-col gap-3 min-h-40">
        {children}
      </div>
    </div>
  );
}
