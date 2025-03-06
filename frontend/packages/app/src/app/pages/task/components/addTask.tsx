/**
 * External dependencies.
 */
import { useState } from "react";
import { useToast } from "@next-pms/design-system/components";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { LoaderCircle, Save, X } from "lucide-react";
import { z } from "zod";
import { FormDialog } from "@/app/components/form-dialog";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { TaskSchema } from "@/schema/task";
import { ProjectProps } from "@/types";
import { AddTaskType } from "@/types/task";
import { Action, TaskState } from "../reducer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AddTaskPropType = { task: TaskState; mutate: any; dispatch: React.Dispatch<Action> };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const AddTask = ({ task, mutate, dispatch }: AddTaskPropType) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { toast } = useToast();

  const { call } = useFrappePostCall("next_pms.timesheet.api.task.add_task");

  const { data: projects } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name"],
    limit_page_length: "null",
  });

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
    dispatch({ type: "SET_ADD_TASK_DIALOG", payload: false });
    mutate();
  };
  return (
    <FormDialog
      fields={[
        [
          {
            label: "Subject",
            name: "subject",
            placeholder: "New subject",
            value: "",
            onChange: () => {},
            type: "text",
            className: "sm:col-span-9",
          },
          {
            label: "Expected Time",
            name: "expected_time",
            placeholder: "Time(in hours)",
            value: "",
            onChange: () => {},
            type: "text",
            className: "sm:col-span-3",
          },
        ],
        [
          {
            label: "Project",
            name: "project",
            placeholder: "Search Project",
            value: "",
            data: projects?.message?.map((item: ProjectProps) => ({
              label: item.project_name,
              value: item.name,
            })),
            onChange: () => {},
            type: "search",
            className: "sm:col-span-12",
          },
        ],
        [
          {
            label: "Description",
            name: "description",
            placeholder: "Explain the subject",
            value: "",
            onChange: () => {},
            type: "text-area",
            className: "sm:col-span-12",
          },
        ],
      ]}
      butttons={[
        {
          label: "Add Task",
          disabled: isSubmitting,
          Icon: () => {
            if (isSubmitting) {
              return <LoaderCircle className="animate-spin w-4 h-4" />;
            }
            return <Save />;
          },
          variant: "default",
          type: "submit",
        },
        {
          label: "Cancel",
          disabled: isSubmitting,
          Icon: () => {
            return <X />;
          },
          onClick: closeAddTaskDialog,
          variant: "secondary",
          type: "default",
        },
      ]}
      formObject={{
        schema: TaskSchema,
        defaultValues: {
          subject: "",
          project: "",
          expected_time: "",
          description: "",
        },
        mode: "onSubmit",
      }}
      dialogObject={{
        open: true,
        onOpenChange: closeAddTaskDialog,
        title: "Add Task",
      }}
      onSubmit={handleSubmit}
      onClose={() => {}}
    ></FormDialog>
  );
};
