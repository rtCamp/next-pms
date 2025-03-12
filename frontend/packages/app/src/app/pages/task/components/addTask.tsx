/**
 * External dependencies.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ComboBox,
  Button,
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  Separator,
  TextArea,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
  useToast,
} from "@next-pms/design-system/components";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Search, LoaderCircle, Save, X } from "lucide-react";
import { type KeyedMutator } from "swr";
import { z } from "zod";
/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { TaskSchema } from "@/schema/task";
import { ProjectProps } from "@/types";
import { AddTaskType } from "@/types/task";
import { Action, TaskState } from "../reducer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AddTaskPropType = { task: TaskState; mutate: KeyedMutator<any>; dispatch: React.Dispatch<Action> };

export const AddTask = ({ task, mutate, dispatch }: AddTaskPropType) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  const { call } = useFrappePostCall("next_pms.timesheet.api.task.add_task");
  const form = useForm<z.infer<typeof TaskSchema>>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      subject: "",
      project: "",
      expected_time: "",
      description: "",
    },
    mode: "onSubmit",
  });

  const { data: projects } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name"],
    limit_page_length: "null",
  });
  const {
    formState: { isDirty, isValid },
  } = form;
  const handleSubmit = (data: z.infer<typeof TaskSchema>) => {
    setIsSubmitting(true);
    const sanitizedTaskData: AddTaskType = {
      subject: data.subject.trim(),
      description: data.description.trim(),
      expected_time: String(data.expected_time),
      project: data.project.trim(),
    };
    call(sanitizedTaskData)
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });

        setIsSubmitting(false);
        closeAddTaskDialog();
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
        setIsSubmitting(false);
      });
  };
  const closeAddTaskDialog = () => {
    if (isSubmitting) return;
    form.reset();
    dispatch({ type: "SET_ADD_TASK_DIALOG", payload: false });
    mutate();
  };
  const handleSubjectChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    form.setValue("subject", event.target.value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };
  const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    form.setValue("expected_time", event.target.value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };
  const handleProjectChange = (data: string[] | string) => {
    form.setValue("project", data[0], { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  return (
    <>
      <Dialog onOpenChange={closeAddTaskDialog} open={task.isAddTaskDialogBoxOpen}>
        <DialogContent aria-description="" aria-describedby="" className="max-w-xl">
          <DialogHeader className="pb-2">
            <DialogTitle>Add Task</DialogTitle>
            <Separator />
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="flex flex-col gap-y-2">
                <div className="grid max-sm:grid-rows-2 sm:grid-cols-12 gap-3">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-9">
                        <FormLabel className="flex gap-2 items-center">
                          <p title="subject" className="text-sm truncate">
                            Subject
                          </p>
                        </FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Input
                              placeholder="New subject"
                              className="placeholder:text-slate-400 placeholder:text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                              type="text"
                              onChange={handleSubjectChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* expected time  */}
                  <FormField
                    control={form.control}
                    name="expected_time"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-3">
                        <FormLabel title="expected time" className="flex gap-2 items-center text-sm truncate">
                          Expected Time
                        </FormLabel>
                        <FormControl>
                          <FormControl>
                            <div className="relative flex items-center">
                              <Input
                                placeholder="Time(in hours)"
                                className="placeholder:text-slate-400 placeholder:text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                {...field}
                                type="text"
                                onChange={handleTimeChange}
                              />
                            </div>
                          </FormControl>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="project"
                  render={() => (
                    <FormItem>
                      <FormLabel>Projects</FormLabel>
                      <FormControl>
                        <ComboBox
                          label="Search Project"
                          showSelected
                          shouldFilter
                          value={form.getValues("project") ? [form.getValues("project")] : []}
                          data={projects?.message?.map((item: ProjectProps) => ({
                            label: item.project_name,
                            value: item.name,
                          }))}
                          onSelect={handleProjectChange}
                          rightIcon={<Search className="tasksstroke-slate-400" />}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <TextArea
                          placeholder="Explain the subject"
                          rows={4}
                          className="w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="sm:justify-start pt-2 w-full">
                  <div className="flex gap-x-4 w-full">
                    <Button disabled={isSubmitting || !isDirty || !isValid}>
                      {isSubmitting ? <LoaderCircle className="animate-spin w-4 h-4" /> : <Save />}
                      Add Task
                    </Button>
                    <Button variant="secondary" type="button" onClick={closeAddTaskDialog} disabled={isSubmitting}>
                      <X />
                      Cancel
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
