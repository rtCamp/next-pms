import { Button } from "@/app/components/ui/button";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Download, FileDown, X } from "lucide-react";
import { Separator } from "./ui/separator";
import { useState } from "react";
import { Checkbox } from "@/app/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";

interface ExportProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
  headers: Array<{ label: string; value: string }>;
}
enum fileType {
  Excel = "Excel",
  CSV = "CSV",
}
enum exportType {
  Filter = "filter",
  All = "all",
}
const schema = z.object({
  file_type: z.enum([fileType.CSV, fileType.Excel], {
    required_error: "Please select a file type.",
  }),
  export_type: z.enum([exportType.Filter, exportType.All], {
    required_error: "Please select a export type.",
  }),
});
// used to export the table data to csv or excel.
export const Export = ({ rows = [], headers }: ExportProps) => {
  const [columns, setColumns] = useState(headers);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });
  const handleSubmit = (data: z.infer<typeof schema>) => {
    if (data.file_type === "Excel") {
      excelExport();
    }
  };
  const handleCancel = () => {
    form.reset();
  };
  const excelExport = () => {
    const filteredData = rows.map((row) =>
      columns.reduce(
        (acc, col) => {
          if (col.value in row) {
            acc[col.value] = row[col.value];
          }
          return acc;
        },
        {} as Record<string, any>,
      ),
    );

    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: columns.map((col) => col.label) });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "data.xlsx");
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Download /> Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <Separator />
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="flex gap-x-4 pb-3">
              <FormField
                control={form.control}
                name="file_type"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="File Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excel">Excel</SelectItem>
                          <SelectItem value="CSV">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="export_type"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Export Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="filter">Filtered Records</SelectItem>
                          <SelectItem value="all">All Records</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator />
            <div id="column-selector" className="grid grid-cols-3 gap-2 pt-3">
              {headers.map((header) => {
                return (
                  <div className="flex gap-x-1 text-sm items-center">
                    <Checkbox
                      id={header.value}
                      checked={columns.some((column) => column.value === header.value)}
                      onCheckedChange={() => {
                        if (columns.some((column) => column.value === header.value)) {
                          setColumns(columns.filter((column) => column.value != header.value));
                        } else {
                          setColumns([...columns, { value: header.value, label: header.label }]);
                        }
                      }}
                    />
                    <label htmlFor={header.value}>{header.label}</label>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button>
                <FileDown /> Export
              </Button>
              <DialogClose onClick={handleCancel} type="button" asChild>
                <Button variant="secondary">
                  <X /> Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
