import { useForm } from "react-hook-form";
import {
  Dialog,
  CustomDialogContent,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TimesheetProp } from "@/app/types/timesheet";
import { Input } from "@/components/ui/input";
import { useFetchTask } from "@/app/api/timesheet";
import { ScreenLoader } from "@/app/components/Loader";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
interface Task {
  name: string;
  subject: string;
}
export function TimesheetDialog({
  isOpen,
  timesheet,
  closeDialog,
}: {
  isOpen: boolean;
  timesheet: TimesheetProp;
  closeDialog: () => void;
}) {
  const tasks: any = useFetchTask();
  console.log(tasks)
  if (tasks?.isLoading) {
    return <ScreenLoader isFullPage={false} />;
  }
    const form = useForm()
  console.log(form)  
//   const FormSchema = z.object({
//     name: z.string({
//       required_error: "Please select a task.",
//     }),
//   });

//   const form = useForm<z.infer<typeof FormSchema>>({
//     resolver: zodResolver(FormSchema),
//     defaultValues: {
//       name: "",
//     },
//   });

//   function onSubmit(values: z.infer<typeof FormSchema>) {
//     console.log(values);
//   }
  return (<></>)
//   return (
//     <Dialog open={isOpen}>
//       <CustomDialogContent
//         className="sm:max-w-md timesheet-dialog"
//         isCloseButton={true}
//         closeAction={closeDialog}
//       >
//         <DialogHeader>
//           <DialogTitle></DialogTitle>
//           <DialogDescription>
//             Anyone who has this link will be able to view this.
//           </DialogDescription>
//         </DialogHeader>
//         <div>
//           <Form {...form}>
//             <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
//               <FormField
//                 name="name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Task</FormLabel>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <FormControl>
//                           <Button variant="outline" role="combobox">
//                             {field.value
//                               ? tasks?.data.find(
//                                   (task: Task) => task.name === field.value
//                                 )?.subject
//                               : "Select Task"}
//                             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//                           </Button>
//                         </FormControl>
//                       </PopoverTrigger>
//                       <PopoverContent>
//                         <Command>
//                           <CommandInput placeholder="Search Task..." />
//                           <CommandEmpty>No task found.</CommandEmpty>
//                           <CommandGroup>
//                             {tasks?.data.map((task: Task) => (
//                               <CommandItem
//                                 value={task.subject}
//                                 key={task.name}
//                                 onSelect={() => {
//                                   form.setValue("name", task.name);
//                                 }}
//                               >
//                                 <Check
//                                   className={cn(
//                                     "mr-2 h-4 w-4",
//                                     task.name === field.value
//                                       ? "opacity-100"
//                                       : "opacity-0"
//                                   )}
//                                 />
//                                 {task.subject}
//                               </CommandItem>
//                             ))}
//                           </CommandGroup>
//                         </Command>
//                       </PopoverContent>
//                     </Popover>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </form>
//           </Form>
//         </div>
//       </CustomDialogContent>
//     </Dialog>
//   );
}
