import { ComboxBox } from "@/app/components/comboBox";
import { DialogHeader, DialogFooter } from "@/app/components/ui/dialog";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { TaskSchema } from "@/schema/task";
import { TaskState, AddTaskType, setAddTaskDialog } from "@/store/task";
import { ProjectProps } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { useFrappePostCall } from "frappe-react-sdk";
import { Search, LoaderCircle, Save, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { z } from "zod";
import { setProjectSearchType } from "@/types/task";
import { useState } from "react";
import { Separator } from "@/app/components/ui/separator";

export const AddTask = ({
  task,
  projects,
  setProjectSearch,
  mutate
}: {
  task: TaskState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    projects: any;
  mutate:any
  setProjectSearch: setProjectSearchType;
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const dispatch = useDispatch();
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
    setProjectSearch("");
    form.reset();
    dispatch(setAddTaskDialog(false));
    mutate();
  };
  const handleSubjectChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    form.setValue("subject", event.target.value);
  };
  const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    form.setValue("expected_time", event.target.value);
  };
  const handleProjectChange = (data: string[] | string) => {
    form.setValue("project", data[0]);
  };
  const handleProjectSearch = (searchString: string) => {
    setProjectSearch(searchString);
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
                  {/* subject field */}
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
                          <>
                            <div className="relative flex items-center">
                              <Input
                                placeholder="New subject"
                                className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                                {...field}
                                type="text"
                                onChange={handleSubjectChange}
                              />
                            </div>
                          </>
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
                            <>
                              <div className="relative flex items-center">
                                <Input
                                  placeholder="Time(in hours)"
                                  className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                                  {...field}
                                  type="text"
                                  onChange={handleTimeChange}
                                />
                              </div>
                            </>
                          </FormControl>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* project combobox */}
                <FormField
                  control={form.control}
                  name="project"
                  render={() => (
                    <FormItem>
                      <FormLabel>Projects</FormLabel>
                      <FormControl>
                        <ComboxBox
                          label="Search Project"
                          showSelected
                          value={form.getValues("project") ? [form.getValues("project")] : []}
                          data={projects?.message?.map((item: ProjectProps) => ({
                            label: item.project_name,
                            value: item.name,
                          }))}
                          onSelect={handleProjectChange}
                          onSearch={handleProjectSearch}
                          rightIcon={<Search className="h-4 w-4 stroke-slate-400" />}
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
                        <Textarea
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
