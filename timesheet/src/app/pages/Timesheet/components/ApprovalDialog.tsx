import {
  Dialog,
  CustomDialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ApprovalDialog({
  isOpen,
  closeDialog,
}: {
  isOpen: boolean;
  closeDialog: () => void;
}) {
  const FormSchema = z.object({
    note: z.string({}),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      note: "",
    },
  });
  function onSubmit(values: z.infer<typeof FormSchema>) {
    console.log(values);
    closeDialog();
  }
  return (
    <Dialog open={isOpen}>
      <CustomDialogContent
        className="sm:max-w-md timesheet-dialog"
        isCloseButton={true}
        closeAction={closeDialog}
      >
        <div className="pt-8">
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Notes..."
                        {...field}
                        onChange={(event) => {
                          field.onChange(event.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Submit for Approval</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
}
