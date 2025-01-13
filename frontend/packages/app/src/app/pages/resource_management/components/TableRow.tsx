/**
 * External dependencies.
 */
import React from "react";

/**
 * Internal dependencies.
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { TableRow } from "@/app/components/ui/table";
import { cn } from "@/lib/utils";

import { TableInformationCellContent } from "./TableCell";
import { getTableCellRow } from "../utils/helper";

interface ResourceTeamTableRowProps {
  name: string;
  avatar: string;
  avatar_abbr: string;
  avatar_name: string;
  RowComponent: React.FC;
  RowExpandView?: React.FC;
}

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
const ResourceTableRow = ({
  name,
  avatar,
  avatar_abbr,
  avatar_name,
  RowComponent,
  RowExpandView,
}: ResourceTeamTableRowProps) => {
  return (
    <Accordion type="multiple" key={name} className="w-full">
      <AccordionItem value={name} className="border-b-0">
        <TableRow key={name} className={cn(getTableCellRow())}>
          <AccordionTrigger hideChevronDown={true} className="hover:no-underline py-0">
            <TableInformationCellContent
              cellClassName="overflow-hidden flex items-center font-normal hover:underline"
              CellComponet={() => {
                return (
                  <Avatar className="w-6 h-6">
                    {<AvatarImage src={decodeURIComponent(avatar)} />}
                    <AvatarFallback>{avatar_abbr && avatar_abbr[0]}</AvatarFallback>
                  </Avatar>
                );
              }}
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

export { ResourceTableRow };
