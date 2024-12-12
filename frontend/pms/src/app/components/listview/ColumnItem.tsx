import { GripVertical, X } from "lucide-react";
import { Typography } from "../typography";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { useDrag, useDrop } from "react-dnd";

const ColumnItem = ({
  id,
  onColumnHide,
  reOrder,
  isVisible,
  label,
  toggleVisibility,
}: {
  id: string;
  onColumnHide: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reOrder: any;
  label: string;
  isVisible: boolean;
  toggleVisibility: (value?: boolean) => void;
}) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "COLUMN",
    item: { id: id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });
  const [, dropRef] = useDrop({
    accept: "COLUMN",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    drop: (draggedColumn: any) => {
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
      <span
        className="w-full flex justify-between gap-x-2 items-center"
        style={{
          opacity: isDragging ? 0.5 : 1,
        }}
      >
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
