/**
 * External dependencies.
 */
import { TableBody, TableCell, TableRow } from "@next-pms/design-system/components";

/**
 * This component is responsible for rendering the empty table body.
 *
 * @returns React.FC
 */
const EmptyTableBody = () => {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={15} className="h-24 text-center">
          No results
        </TableCell>
      </TableRow>
    </TableBody>
  );
};

export { EmptyTableBody };
