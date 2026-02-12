/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
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
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
  useToast,
  Spinner,
} from "@next-pms/design-system/components";
import { useFrappeGetCall, useFrappeCreateDoc } from "frappe-react-sdk";
import { Search, LoaderCircle, Save, X } from "lucide-react";
import type { KeyedMutator } from "swr";
import { z } from "zod";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { ProjectSchema } from "@/schema/project";
import { ProjectState, setIsAddProjectDialogOpen } from "@/store/project";
import { DocMetaProps } from "@/types";
import { AddProjectType } from "../types";

type AddProjectProps = {
  project: ProjectState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate: KeyedMutator<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: React.Dispatch<any>;
  meta: DocMetaProps;
};
export const AddProject = ({
  project,
  mutate,
  dispatch,
  meta,
}: AddProjectProps) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [namingSeries, setNamingSeries] = useState<Record<string, any>>(
    meta?.fields?.filter((item) => item.fieldname === "naming_series")[0],
  );
  const { toast } = useToast();

  const { createDoc } = useFrappeCreateDoc();
  const form = useForm<z.infer<typeof ProjectSchema>>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      naming_series: "",
      project_name: "",
      project_template: "",
      company: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (meta?.fields) {
      setNamingSeries(
        meta?.fields?.filter((item) => item.fieldname === "naming_series")[0],
      );
    }
  }, [meta]);

  useEffect(() => {
    if (namingSeries) {
      form.setValue("naming_series", namingSeries.options?.split("\n")[0]);
    }
  }, [namingSeries, form]);

  const { data: companies, isLoading: isCompanyLoading } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Company",
      fields: ["name"],
      limit_page_length: "null",
    },
  );

  useEffect(() => {
    if (companies?.message) {
      form.setValue("company", companies?.message[0].name);
    }
  }, [companies, form]);
  const { data: from_templates, isLoading: isFromTemplateLoading } =
    useFrappeGetCall(
      "frappe.client.get_list",
      {
        doctype: "Project Template",
        fields: ["name"],
        limit_page_length: "null",
      },
      undefined,
      {
        errorRetryCount: 0,
        shouldRetryOnError: false,
      },
    );

  const {
    formState: { isDirty, isValid },
  } = form;

  const handleSubmit = (data: z.infer<typeof ProjectSchema>) => {
    setIsSubmitting(true);
    const sanitizedTaskData: AddProjectType = {
      naming_series: data.naming_series.trim(),
      project_name: data.project_name.trim(),
      project_template: data.project_template ?? null,
      company: data.company.trim(),
    };
    createDoc("Project", sanitizedTaskData)
      .then(() => {
        toast({
          variant: "success",
          description: "Project created successfully",
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
    dispatch(setIsAddProjectDialogOpen(false));
    mutate();
  };
  const handleSeriesChange = (value: string | string[]) => {
    const seriesValue = Array.isArray(value) ? value[0] : value;
    form.setValue("naming_series", seriesValue, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };
  const handleCompanyChange = (value: string | string[]) => {
    const companyValue = Array.isArray(value) ? value[0] : value;
    form.setValue("company", companyValue, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };
  const handleFromTemplateChange = (value: string | string[]) => {
    const fromTemplateValue = Array.isArray(value) ? value[0] : value;
    form.setValue("project_template", fromTemplateValue, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };
  const handleProjectChange: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    form.setValue("project_name", event.target.value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <>
      <Dialog
        onOpenChange={closeAddTaskDialog}
        open={project.isAddProjectDialogOpen}
      >
        <DialogContent
          aria-description=""
          aria-describedby=""
          className="max-w-xl"
        >
          <DialogHeader className="pb-2">
            <DialogTitle>Add Project</DialogTitle>
            <Separator />
          </DialogHeader>
          {isCompanyLoading || isFromTemplateLoading ? (
            <Spinner className="h-32" isFull={true} />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="flex flex-col gap-y-2">
                  <FormField
                    control={form.control}
                    name="naming_series"
                    render={() => (
                      <FormItem>
                        <FormLabel>Series</FormLabel>
                        <FormControl>
                          <ComboBox
                            label="Search Naming Series"
                            showSelected
                            shouldFilter
                            value={
                              form.getValues("naming_series")
                                ? [form.getValues("naming_series")]
                                : []
                            }
                            data={namingSeries?.options
                              ?.split("\n")
                              ?.map((item: string) => ({
                                label: item,
                                value: item,
                              }))}
                            onSelect={handleSeriesChange}
                            rightIcon={
                              <Search className="tasksstroke-slate-400" />
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="project_name"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-9">
                        <FormLabel className="flex gap-2 items-center">
                          <p title="subject" className="text-sm truncate">
                            Project Name
                          </p>
                        </FormLabel>
                        <FormControl>
                          <div className="relative flex items-center">
                            <Input
                              placeholder="New Project"
                              className="placeholder:text-slate-400 placeholder:text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                              type="text"
                              onChange={handleProjectChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="project_template"
                    render={() => (
                      <FormItem>
                        <FormLabel>Project Template</FormLabel>
                        <FormControl>
                          <ComboBox
                            label="Search Project Template"
                            showSelected
                            shouldFilter
                            value={
                              form.getValues("project_template")
                                ? [form.getValues("project_template") as string]
                                : []
                            }
                            data={from_templates?.message?.map(
                              (item: { name: string }) => ({
                                label: item.name,
                                value: item.name,
                              }),
                            )}
                            onSelect={handleFromTemplateChange}
                            rightIcon={
                              <Search className="tasksstroke-slate-400" />
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={() => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <ComboBox
                            label="Search Company"
                            showSelected
                            shouldFilter
                            value={
                              form.getValues("company")
                                ? [form.getValues("company")]
                                : []
                            }
                            data={companies?.message?.map(
                              (item: { name: string }) => ({
                                label: item.name,
                                value: item.name,
                              }),
                            )}
                            onSelect={handleCompanyChange}
                            rightIcon={
                              <Search className="tasksstroke-slate-400" />
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="sm:justify-start pt-2 w-full">
                    <div className="flex gap-x-4 w-full">
                      <Button disabled={isSubmitting || !isDirty || !isValid}>
                        {isSubmitting ? (
                          <LoaderCircle className="animate-spin w-4 h-4" />
                        ) : (
                          <Save />
                        )}
                        Add Project
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={closeAddTaskDialog}
                        disabled={isSubmitting}
                      >
                        <X />
                        Cancel
                      </Button>
                    </div>
                  </DialogFooter>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
