/**
 * External dependencies.
 */
import type {
  SortableDraggable,
  SortableDroppable,
} from "@dnd-kit/dom/sortable";

/**
 * Internal dependencies.
 */
import type { RiskStatus } from "../constants";

export type RiskIdsByStatus = Record<RiskStatus, string[]>;

export type RiskDragData = { column: RiskStatus };
export type RiskDraggable = SortableDraggable<RiskDragData>;
export type RiskDroppable = SortableDroppable<RiskDragData>;
