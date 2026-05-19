/**
 * External dependencies.
 */
import { useSortable } from "@dnd-kit/react/sortable";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "../../utils";

type DraggableProps = {
  id: string;
  index: number;
  column: string;
  className?: string;
  children: React.ReactNode;
};

export function Draggable({
  id,
  index,
  column,
  className,
  children,
}: DraggableProps) {
  const { ref, isDragging } = useSortable({
    id,
    index,
    group: column,
    type: "item",
    accept: ["item"],
  });

  return (
    <div
      ref={ref}
      className={mergeClassNames(
        className,
        "transition-shadow h-full",
        isDragging && "shadow-xl",
      )}
    >
      {children}
    </div>
  );
}
