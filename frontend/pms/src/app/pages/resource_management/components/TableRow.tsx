import { Typography } from "@/app/components/typography";
import { TableCell, TableRow } from "@/app/components/ui/table";
import { cn } from "@/lib/utils";
import { getTableCellRow } from "../utils/helper";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion";

interface ResourceTeamTableRowProps {
  name: string;
  avatar: string;
  avatar_abbr: string;
  avatar_name: string;
  RowComponent: React.FC;
  RowExpandView?: React.FC;
}

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
        <TableRow key={name} className={cn(getTableCellRow(), "relative overflow-hidden")}>
          <TableCell className={cn("w-[24rem]", "overflow-hidden")}>
            <AccordionTrigger hideChevronDown={true} className="hover:no-underline py-0">
              <span className="flex gap-x-2 items-center font-normal hover:underline w-full">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={decodeURIComponent(avatar)} />
                  <AvatarFallback>{avatar_abbr}</AvatarFallback>
                </Avatar>
                <Typography variant="p" className="text-left text-ellipsis whitespace-nowrap overflow-hidden ">
                  {avatar_name}
                </Typography>
              </span>
            </AccordionTrigger>
          </TableCell>
          <RowComponent />
        </TableRow>
        <AccordionContent className="pb-0">{RowExpandView && <RowExpandView />}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export { ResourceTableRow };
