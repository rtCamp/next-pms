/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { AddMd } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { BAR_HEIGHT, BAR_MARGIN, CELL_HEIGHT } from "../constants";

interface AddBlockProps {
  /** Absolute left position including headerWidth offset */
  left: number;
  /** Width of one day column */
  width: number;
  /** Click handler for when the add button is pressed */
  onClick?: () => void;
}

/**
 * Floating add allocation trigger that appears on hover over empty timeline cells.
 */
export function AddBlock({ left, width, onClick }: AddBlockProps) {
  return (
    <Button
      type="button"
      variant="subtle"
      className="absolute"
      style={{
        left: Math.max(left - BAR_MARGIN / 2, 0),
        width: Math.max(width - BAR_MARGIN, 0),
        height: BAR_HEIGHT,
        top: (CELL_HEIGHT - BAR_HEIGHT) / 2,
      }}
      onClick={onClick}
      icon={() => <AddMd className="h-4 w-4" />}
    />
  );
}

AddBlock.displayName = "AddBlock";
