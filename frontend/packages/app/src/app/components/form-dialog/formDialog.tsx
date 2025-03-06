/**
 * External dependencies.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@next-pms/design-system";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  Separator,
  Form,
} from "@next-pms/design-system/components";
import { z } from "zod";

/**
 * Internal dependencies.
 */
import { FormDialogButton } from "./components";
import { FormDialogFieldGroup } from "./components/fieldGroup";
import { FormDialogProps } from "./type";

export const FormDialog = ({ fields, butttons, formObject, dialogObject, onSubmit }: FormDialogProps) => {
  // const { toast } = useToast();

  const form = useForm<z.infer<typeof formObject.schema>>({
    resolver: zodResolver(formObject.schema),
    defaultValues: formObject.defaultValues,
    mode: formObject.mode,
  });

  // const {
  //   formState: { isDirty, isValid },
  // } = form;

  return (
    <>
      <Dialog onOpenChange={dialogObject.onOpenChange} open={dialogObject.open}>
        <DialogContent
          aria-description={dialogObject.ariaDescription}
          aria-describedby={dialogObject.ariaDescribedby}
          className={cn("max-w-xl", dialogObject.contentClassName)}
        >
          <DialogHeader className="pb-2">
            <DialogTitle className={dialogObject.titleClassName}>{dialogObject.title}</DialogTitle>
            <Separator />
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormDialogFieldGroup fields={fields} form={form} />
            </form>
          </Form>
          <DialogFooter className={cn("sm:justify-start pt-2 w-full", dialogObject.footerClassName)}>
            <div className={cn("flex gap-x-4 w-full", dialogObject.footerButtonClassName)}>
              {butttons.map((button, index) => {
                return <FormDialogButton key={index} {...button} />;
              })}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
