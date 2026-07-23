/**
 * External Dependencies
 */
import {
  Accordion,
  AccordionTrigger,
  AccordionItem,
  AccordionContent,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
} from "@next-pms/design-system/components";
/**
 * Internal dependencies
 */
import type { LeaveInfoProps } from "./types";

export const LeaveInfo = ({ leaveInfo }: LeaveInfoProps) => {
  return (
    <Accordion type="single" collapsible key="leave-info">
      <AccordionItem value="leave-info" className="">
        <AccordionTrigger className="py-2 hover:no-underline">Allocated Leaves</AccordionTrigger>
        <AccordionContent className="pb-0">
          {!leaveInfo || Object.keys(leaveInfo).length === 0 ? (
            <Typography>No leaves have been allocated.</Typography>
          ) : (
            <Table className="[&_tr]:border-r [&_tr]:border-l">
              <TableHeader>
                <TableRow className="[&_th]:h-0 [&_th]:py-2 [&_th]:border-r [&_th:last-child]:border-r-0 ">
                  <TableHead className="w-[50%]">Leave Type</TableHead>
                  <TableHead>Total Leaves</TableHead>
                  <TableHead>Available Leaves</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:last-child]:border-r [&_td]:border-r [&_td:last-child]:border-r-0 [&_tr:last-child]:border-l">
                {Object.entries(leaveInfo).map(([key, value], index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{key}</TableCell>
                      <TableCell>{value.total_leaves}</TableCell>
                      <TableCell>{value.remaining_leaves}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
