/**
 * External dependencies.
 */
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  Typography,
} from "@next-pms/design-system/components";
import { X, Move, Copy } from "lucide-react";

/**
 * Internal dependencies.
 */
import { ItemAllocationActionDialogProps } from "./types";

export const ItemAllocationActionDialog = ({
  handleMove,
  handleCopy,
  handleCancel,
}: ItemAllocationActionDialogProps) => {
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={(open: boolean) => {
        setOpen(open);
        handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[425px] z-[1000]">
        <DialogHeader>
          <DialogDescription>
            <Typography className="text-xl mb-2 mt-3 font-semibold">
              Are you sure you want to move or copy this allocation?
            </Typography>
            <Typography className="text-sm">
              This action will either move or copy the given allocation. Please confirm your choice.
            </Typography>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            className="outline-none"
            onClick={() => {
              setOpen(false);
              handleMove();
            }}
          >
            <Move className="w-4 h-4" />
            Move
          </Button>
          <Button
            className="outline-none"
            onClick={() => {
              setOpen(false);
              handleCopy();
            }}
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
          <Button
            type="button"
            className="outline-none"
            variant="secondary"
            onClick={() => {
              handleCancel();
            }}
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
