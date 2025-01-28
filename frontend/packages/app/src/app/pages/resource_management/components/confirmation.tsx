/**
 * External dependencies.
 */
import { cn } from "@next-pms/design-system";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  Typography,
} from "@next-pms/design-system/components";
import { LoaderCircle, Trash2, X } from "lucide-react";

/**
 * The resource delete allocation alert dialog.
 *
 * Why not use react-alert-dialog?
 * The above package was creating issues for form dynamic field selection, also it has bugs in recent versions: https://github.com/shadcn-ui/ui/issues/1655 so for now I have used dialog only.
 *
 * @param props.onDelete The function to be called when delete dialog is clicked.
 * @param props.isOpen The state to open the dialog.
 * @param props.isLoading The state to show the loader.
 * @param props.onOpen The function to open the dialog.
 * @param props.onCancel The function to cancel the dialog.
 * @returns React.FC
 */
const DeleteAllocation = ({
  onDelete,
  isOpen,
  isLoading,
  onOpen,
  onCancel,
  buttonClassName,
}: {
  onDelete: () => void;
  isOpen: boolean;
  isLoading: boolean;
  onOpen: () => void;
  onCancel: () => void;
  buttonClassName?: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onCancel()}>
      <DialogTrigger asChild>
        <Trash2
          className={cn("w-4 hover:text-red-500", buttonClassName)}
          size={16}
          strokeWidth={1.25}
          aria-label="Delete"
          onClick={onOpen}
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] z-[1000]">
        <DialogHeader>
          <DialogDescription>
            <Typography className="text-xl mb-2 mt-3 font-semibold">
              Are you sure you want to delete this allocation?
            </Typography>
            <Typography className="text-sm">
              This action cannot be undone. This will permanently delete the given allocation.
            </Typography>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button className="outline-none" variant="destructive" onClick={onDelete}>
            {isLoading ? (
              <LoaderCircle className="animate-spin w-4 h-4 outline-none" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete
          </Button>
          <Button type="button" className="outline-none" variant="secondary" onClick={onCancel}>
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { DeleteAllocation };
