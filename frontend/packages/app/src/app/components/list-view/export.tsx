/**
 * External dependencies
 */
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Typography,
  Button,
} from "@next-pms/design-system/components";
import { FileDown } from "lucide-react";
import { z } from "zod";
/**
 * Internal dependencies
 */
import type { ExportProps } from "./types";

enum fileType {
  Excel = "Excel",
  CSV = "CSV",
}

const schema = z.object({
  file_type: z.enum([fileType.CSV, fileType.Excel], {
    required_error: "Please select a file type.",
  }),
  export_all: z.boolean(),
});

/**
 * Export component
 * @description This component is responsible for rendering the export dialog.
 * @param doctype The doctype for which the data is being exported.
 * @param fields The fields to be exported.
 * @param filters The filters to be applied while exporting the data.
 * @param orderBy The order by clause for the data.
 * @param pageLength The number of records per page.
 * @param totalCount The total number of records.
 * @param isOpen The flag to show the dialog.
 * @param setIsOpen The function to toggle the dialog.
 * @returns React.FC
 */
export const Export = ({
  doctype,
  isOpen,
  fields,
  orderBy,
  pageLength,
  totalCount,
  setIsOpen,
  filters,
}: ExportProps) => {
  const [columns, setColumns] = useState(["name", "creation", "modified"]);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      file_type: fileType.Excel,
      export_all: false,
    },
  });
  useEffect(() => {
    const uniqueColumns = Array.from(new Set(["name", ...Object.keys(fields), "creation", "modified"]));
    setColumns(uniqueColumns);
  }, [fields]);

  const handleSubmit = (data: z.infer<typeof schema>) => {
    const length = data.export_all ? totalCount : pageLength;
    let url = `/api/method/frappe.desk.reportview.export_query?file_format_type=${
      data.file_type
    }&title=${doctype}&doctype=${doctype}&fields=${JSON.stringify(
      columns
    )}&order_by=${orderBy}&page_length=${length}&start=0`;
    if (filters) {
      url += `&filters=${JSON.stringify(filters)}`;
    }
    window.location.href = url;
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <Separator />
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="flex flex-col gap-y-3">
              <FormField
                control={form.control}
                name="file_type"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>File Type</FormLabel>
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
                name="export_all"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <div className="flex items-center gap-x-2">
                        <Checkbox onCheckedChange={field.onChange} checked={field.value} name="export_all" />
                        <Typography> Export All {totalCount} Record/s</Typography>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator className="my-3" />
            <div id="column-selector" className="grid grid-cols-2 gap-2  max-h-64 lg:max-h-96 overflow-y-auto">
              {Object.entries(fields).map(([key, value]) => {
                return (
                  <div className="flex gap-x-1 text-sm items-center" key={key}>
                    <Checkbox
                      id={key}
                      checked={columns.some((column) => column === key)}
                      onCheckedChange={() => {
                        const newColumns = new Set(columns);
                        if (newColumns.has(key)) {
                          newColumns.delete(key);
                        } else {
                          newColumns.add(key);
                        }
                        setColumns(Array.from(newColumns));
                      }}
                    />
                    <Typography>{value}</Typography>
                  </div>
                );
              })}
            </div>
            <Separator className="my-3" />
            <DialogFooter className="w-full">
              <Button className="w-full">
                <FileDown /> Export
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
