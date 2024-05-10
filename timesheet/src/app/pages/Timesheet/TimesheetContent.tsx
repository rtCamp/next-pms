import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TimesheetContent({ data }: { data: any }) {
  const dates = data?.dates;
  const tasks = data?.tasks;
  console.log(tasks)
  return (
    <div>
      <Table className="w-[900px] md:w-full">
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow className="flex bg-muted/40 hover:bg-muted/40 border-t">
            <TableHead
              key="Heading"
              className="flex w-full font-bold items-center text-justify"
            >
              Tasks
            </TableHead>
            {dates.map((date: string) => {
              const { date: formattedDate, day } = formatDate(date);
              return (
                <TableHead
                  key={date}
                  className="flex w-full justify-center flex-col items-start max-w-20 font-bold text-justify px-0"
                >
                  <div>{day}</div>
                  <div>{formattedDate}</div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* {invoices.map((invoice) => (
            <TableRow key={invoice.invoice}>
              <TableCell className="font-medium">{invoice.invoice}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              <TableCell className="text-right">
                {invoice.totalAmount}
              </TableCell>
            </TableRow>
          ))} */}
        </TableBody>
        <TableFooter></TableFooter>
      </Table>
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  const month = date.toLocaleString("default", { month: "short" });
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.toLocaleString("default", { weekday: "short" });
  return { date: `${month} ${dayOfMonth}`, day: dayOfWeek };
}
