/**
 * External dependencies
 */

import { useDrag, useDrop } from "react-dnd";
import { GripVertical, X } from "lucide-react";

/**
 * Internal dependencies
 */
import { Typography } from "@/app/components/typography";
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu";

interface ColumnItemProps {
  id: string;
  onColumnHide: (id: string) => void;
  reOrder: (newOrder: (old: string[]) => string[]) => void;
  label: string;
  isVisible: boolean;
  toggleVisibility: (value?: boolean) => void;
  onDrop: () => void;
}

/**
 * 
 * @param {Object} props - The props for the component.
 * @param {String} props.id - The id of the column.
 * @param {Function} props.onColumnHide - The function to hide the column.
 * @param {Function} props.reOrder - The function to reorder the columns.
 * @param {String} props.label - The label of the column.
 * @param {Boolean} props.isVisible - The visibility of the column.
 * @param {Function} props.toggleVisibility - The function to toggle the visibility of the column.
 * @param {Function} props.onDrop - The function to handle the drop event.
 * @returns React.FC
 */
const ColumnItem = ({ id, onColumnHide, reOrder, isVisible, label, toggleVisibility, onDrop }: ColumnItemProps) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "COLUMN",
    item: { id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: () => onDrop(), // Trigger drop handler on drag end
  });

  const [, dropRef] = useDrop({
    accept: "COLUMN",
    hover: (draggedColumn: { id: string }) => {
      if (draggedColumn.id !== id) {
        reOrder((old: string[]) => {
          const newOrder = [...old];
          const fromIndex = newOrder.indexOf(draggedColumn.id);
          const toIndex = newOrder.indexOf(id);
          newOrder.splice(fromIndex, 1);
          newOrder.splice(toIndex, 0, draggedColumn.id);
          return newOrder;
        });
      }
    },
  });

  return (
    <DropdownMenuItem
      key={id}
      className="capitalize cursor-pointer flex gap-x-2 items-center"
      ref={(node) => dragRef(dropRef(node))}
      onSelect={(event) => event.preventDefault()}
    >
      <span className="w-full flex justify-between gap-x-2 items-center" style={{ opacity: isDragging ? 0.5 : 1 }}>
        <Typography className="flex gap-x-2 items-center">
          <GripVertical />
          {label}
        </Typography>
        <X
          onClick={() => {
            toggleVisibility(!isVisible);
            onColumnHide(id);
          }}
        />
      </span>
    </DropdownMenuItem>
  );
};

export default ColumnItem;
