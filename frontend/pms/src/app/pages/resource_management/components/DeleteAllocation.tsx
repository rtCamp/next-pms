/**
 * External dependencies.
 */
import { Trash2 } from "lucide-react";

/**
 * Internal dependencies.
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";

/**
 * The resource delete allocation alert dialog.
 *
 * @param props.onDelete The function to be called when delete dialog is clicked.
 * @returns
 */
const DeleteAllocation = ({ onDelete }: { onDelete: () => void }) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Trash2 className="w-4 hover:text-red-500" size={16} strokeWidth={1.25} aria-label="Delete" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this allocation?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the given allocation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { DeleteAllocation };
