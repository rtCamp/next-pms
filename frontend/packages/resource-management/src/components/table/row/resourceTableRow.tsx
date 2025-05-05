/**
 * External dependencies.
 */
import { memo, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  TableRow,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { mergeClassNames, getTableCellRow } from "../../../utils";
import { TableInformationCellContent } from "../cell";
import type { ResourceTeamTableRowProps } from "../types";

/**
 * Memoized Avatar cell to prevent image refetch on scroll
 */
const MemoizedAvatarCell = memo(function MemoizedAvatarCell({
  avatar,
  avatar_abbr,
}: {
  avatar: string;
  avatar_abbr: string;
}) {
  return (
    <Avatar className="w-6 h-6">
      <AvatarImage src={decodeURIComponent(avatar)} />
      <AvatarFallback>{avatar_abbr && avatar_abbr[0]}</AvatarFallback>
    </Avatar>
  );
});

/**
 * This component is responsible for loading the resource pages row.
 *
 * @param props.name The name/ID of the resource table row.
 * @param props.avatar The avatar which need to render on first cell.
 * @param props.avatar_abbr The abbreviation of the avatar.
 * @param props.avatar_name The name of the avatar.
 * @param props.RowComponent The row component which need to render.
 * @param props.RowExpandView The expand view of the row.
 * @returns React.FC
 */
const ResourceTableRowComponent = ({
  name,
  avatar,
  avatar_abbr,
  avatar_name,
  RowComponent,
  RowExpandView,
}: ResourceTeamTableRowProps) => {
  const cellComponent = useMemo(() => {
    return () => <MemoizedAvatarCell avatar={avatar} avatar_abbr={avatar_abbr} />;
  }, [avatar, avatar_abbr]);

  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value={name} className="border-b-0">
        <TableRow
          className={mergeClassNames(
            "[&>h3]:sticky [&>h3]:border-r [&>h3]:border-gray-300 [&>h3]:left-0 [&>h3]:bg-background [&>h3]:z-20",
            getTableCellRow()
          )}
        >
          <AccordionTrigger hideChevronDown={true} className="hover:no-underline py-0">
            <TableInformationCellContent
              cellClassName="overflow-hidden flex items-center font-normal hover:underline"
              CellComponent={cellComponent}
              value={avatar_name}
            />
          </AccordionTrigger>
          <RowComponent />
        </TableRow>
        <AccordionContent className="pb-0">{RowExpandView && <RowExpandView />}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
const ResourceTableRow = memo(ResourceTableRowComponent);
export { ResourceTableRow };
