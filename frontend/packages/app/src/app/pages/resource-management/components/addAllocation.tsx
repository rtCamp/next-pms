/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
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
  Input,
  Separator,
  TextArea,
  useToast,
  ComboBox,
  DatePicker,
  Typography,
} from "@next-pms/design-system/components";
import { getFormatedDate, getUTCDateTime } from "@next-pms/design-system/date";
import { mergeClassNames } from "@next-pms/design-system/utils";
import { endOfWeek, startOfWeek } from "date-fns";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { CircleDollarSign, Clock3, LoaderCircle, Save, Search, X } from "lucide-react";
import { useContextSelector } from "use-context-selector";
import { z } from "zod";

/**
 * Internal dependencies.
 */
import EmployeeCombo from "@/app/components/employeeComboBox";
import { ResourceAllocationSchema } from "@/schema/resource";
import { ResourceFormContext } from "../store/resourceFormContext";
import type { AllocationDataProps, ResourceKeys } from "../store/types";
import { getRoundOfValue } from "../utils/helper";

/**
 * This component is used to add and update resource allocations data.
 *
 * @param onSubmit Function to be called when form is submitted.
 * @returns React.FC
 */
const AddResourceAllocations = ({
  onSubmit,
}: {
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
}) => {
  const { allocationData: resourceAllocationForm, dialogState: resourceDialogState } = useContextSelector(
    ResourceFormContext,
    (value) => value.state
  );

  const { resetState } = useContextSelector(ResourceFormContext, (value) => value.actions);

  const [projectSearch, setProjectSearch] = useState(resourceAllocationForm.project_name);
  const [customerSearch, setCustomerSearch] = useState(resourceAllocationForm.customer_name);
  const [enableRepeatOnWeek, setEnableRepeatOnWeek] = useState(false);

  const form = useForm<z.infer<typeof ResourceAllocationSchema>>({
    resolver: zodResolver(ResourceAllocationSchema),
    defaultValues: {
      employee: resourceAllocationForm.employee,
      is_billable: resourceAllocationForm.is_billable,
      project: resourceAllocationForm.project,
      project_name: resourceAllocationForm.project_name,
      customer: resourceAllocationForm.customer,
      customer_name: resourceAllocationForm.customer_name,
      total_allocated_hours: resourceAllocationForm.total_allocated_hours,
      hours_allocated_per_day: resourceAllocationForm.hours_allocated_per_day,
      allocation_start_date: resourceAllocationForm.allocation_start_date,
      allocation_end_date: resourceAllocationForm.allocation_end_date,
      note: resourceAllocationForm.note,
      repeat_till_week_count: 0,
    },
    mode: "onSubmit",
  });

  const {
    data: projects,
    mutate: fetchProjects,
    isLoading: isProjectLoading,
  } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    filters: form.getValues("customer")
      ? [
          ["project_name", "like", `%${projectSearch}%`],
          ["customer", "=", form.getValues("customer")],
        ]
      : [["project_name", "like", `%${projectSearch}%`]],

    fields: ["name", "project_name", "customer", "custom_billing_type"],
    limit_page_length: 20,
  });

  const { data: customers, isLoading: isCustomerLoading } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Customer",
    filters: [["customer_name", "like", `%${customerSearch}%`]],
    fields: ["name", "customer_name"],
    limit_page_length: 20,
  });

  const { data: leaveData, mutate: fetchLeaveData } = useFrappeGetCall(
    "next_pms.resource_management.api.team.get_leave_information",
    {
      employee: form.getValues("employee"),
      start_date: form.getValues("allocation_start_date"),
      end_date: form.getValues("allocation_end_date"),
    }
  );

  const { toast } = useToast();

  const { call: handleCreateAndUpdateOfallocation, loading } = useFrappePostCall(
    "next_pms.resource_management.api.allocation.handle_allocation"
  );

  const handleEmployeeChange = (value: string) => {
    form.setValue("employee", value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    fetchLeaveData();
  };

  const handleCustomerAutoComplete = (value: string) => {
    if (!value) return;

    const projectData = projects?.message?.find(
      (item: { project_name: string; name: string; customer: string }) => item.name === value
    );

    if (!projectData) return;

    if (!projectData.customer) {
      if (!form.getValues("customer")) {
        form.setValue("customer", "", {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        setCustomerSearch("");
      }
    } else {
      if (!form.getValues("customer")) {
        form.setValue("customer", projectData.customer, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        setCustomerSearch(projectData.customer);
      }
    }

    if (projectData.custom_billing_type != "Non-Billable") {
      form.setValue("is_billable", true, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    } else {
      form.setValue("is_billable", false, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const handleSearchChange = (
    key: ResourceKeys,
    value: string | string[],
    handleValueChange: (value: string) => void
  ) => {
    if (typeof value === "string") {
      form.setValue(key, value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      if (key === "project") {
        handleCustomerAutoComplete(value);
      }
      if (!value) {
        handleValueChange("");
      }
    }
    if (value.length > 0) {
      form.setValue(key, value[0], {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      handleCustomerAutoComplete(value[0]);
    } else {
      form.setValue(key, "", {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      handleValueChange("");
    }
  };

  const updateRepeatOnWeekCount = () => {
    const start = form.getValues("allocation_start_date");
    const end = form.getValues("allocation_end_date");

    if (!start || !end || end < start) return;

    const startDate = getUTCDateTime(start);
    const endDate = getUTCDateTime(end);

    const startWeekDate = startOfWeek(startDate, {
      weekStartsOn: 1,
    });
    const endWeekDate = endOfWeek(startDate, { weekStartsOn: 1 });

    if (startDate >= startWeekDate && endDate <= endWeekDate) {
      return setEnableRepeatOnWeek(true);
    }
    form.setValue("repeat_till_week_count", 0, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setEnableRepeatOnWeek(false);
  };

  const handleDateChange = (key: ResourceKeys, date: Date | undefined) => {
    if (!date) return;
    form.setValue(key, getFormatedDate(date), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    if (isNeedToShowLeaveData()) {
      fetchLeaveData();
    }
  };

  const isNeedToShowLeaveData = useCallback(() => {
    return (
      form.getValues("employee") && form.getValues("allocation_start_date") && form.getValues("allocation_end_date")
    );
  }, [form]);

  const handleHoursAutoComplete = useCallback(
    (needToSet: "per_day" | "total" | "all" = "all") => {
      if (!leaveData?.message) {
        return;
      }

      if (isNeedToShowLeaveData()) {
        let hours_allocated_per_day = parseFloat(form.getValues("hours_allocated_per_day") as string);

        if (!hours_allocated_per_day) {
          hours_allocated_per_day = 0;
        }

        let total_allocated_hours = parseFloat(form.getValues("total_allocated_hours") as string);

        if (!total_allocated_hours) {
          total_allocated_hours = 0;
        }

        if (needToSet === "all") {
          if (hours_allocated_per_day) {
            return form.setValue(
              "total_allocated_hours",
              getRoundOfValue(hours_allocated_per_day * leaveData.message.total_working_days).toString(),
              {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              }
            );
          }

          if (total_allocated_hours) {
            if (leaveData.message.total_working_days) {
              return form.setValue(
                "hours_allocated_per_day",
                getRoundOfValue(total_allocated_hours / leaveData.message.total_working_days).toString(),
                {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                }
              );
            } else {
              return form.setValue("hours_allocated_per_day", "0", {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              });
            }
          }
        } else if (needToSet == "total") {
          return form.setValue(
            "total_allocated_hours",
            getRoundOfValue(hours_allocated_per_day * leaveData.message.total_working_days).toString(),
            {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true,
            }
          );
        } else {
          if (leaveData.message.total_working_days) {
            return form.setValue(
              "hours_allocated_per_day",
              getRoundOfValue(total_allocated_hours / leaveData.message.total_working_days).toString(),
              {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              }
            );
          } else {
            return form.setValue("hours_allocated_per_day", "0", {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true,
            });
          }
        }
      }
    },
    [form, isNeedToShowLeaveData, leaveData]
  );

  const handleOpen = (open: boolean): void => {
    if (open === false) {
      form.reset();
      setProjectSearch("");
      setCustomerSearch("");
      resetState();
    }
  };

  const getAllocationApi = (data: AllocationDataProps & { repeat_till_week_count: number }) => {
    const doctypeDoc = {
      doctype: "Resource Allocation",
      employee: data.employee,
      project: data.project,
      customer: data.customer,
      total_allocated_hours: data.total_allocated_hours,
      hours_allocated_per_day: data.hours_allocated_per_day,
      allocation_start_date: data.allocation_start_date,
      allocation_end_date: data.allocation_end_date,
      is_billable: data.is_billable ? 1 : 0,
      note: data.note,
    };
    if (resourceDialogState.isNeedToEdit) {
      return handleCreateAndUpdateOfallocation({ allocation: { ...doctypeDoc, name: resourceAllocationForm.name } });
    }
    return handleCreateAndUpdateOfallocation({
      allocation: doctypeDoc,
      repeat_till_week_count: data.repeat_till_week_count,
    });
  };

  const handleSubmit = (data: AllocationDataProps & { repeat_till_week_count: number }) => {
    if (!data) {
      return;
    }
    getAllocationApi(data)
      .then(() => {
        toast({
          variant: "success",
          description: `Resouce allocation ${resourceDialogState.isNeedToEdit ? "updated" : "created"} successfully`,
        });
        onSubmit(resourceAllocationForm, data);
        handleOpen(false);
      })
      .catch(() => {
        toast({
          variant: "destructive",
          description: `Failed to ${resourceDialogState.isNeedToEdit ? "updated" : "create"} resource allocation`,
        });
      });
  };

  const handleNumberInputValue = (value: string) => {
    const regex = /^\d+(\.\d{0,5})?$/;

    if (!regex.test(value)) {
      return "";
    }

    const newValue = parseFloat(value);

    if (isNaN(newValue)) {
      return "";
    }

    return value;
  };

  useEffect(() => {
    handleHoursAutoComplete();
    updateRepeatOnWeekCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleHoursAutoComplete, leaveData]);

  return (
    <Dialog open={resourceDialogState.isShowDialog} onOpenChange={handleOpen}>
      <DialogContent className="max-w-xl bg-none z-[1000]">
        <DialogHeader>
          <DialogTitle className="flex gap-x-2 mb-2">
            {resourceDialogState.isNeedToEdit ? "Edit" : "Add"} Allocation
          </DialogTitle>
          <Separator />
        </DialogHeader>
        <Form {...form}>
          {/* @ts-expect-error : form.handleSubmit has a type mismatch issue. */}
          <form className="flex flex-col gap-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="employee"
              render={() => (
                <FormItem className="w-full space-y-1">
                  <FormLabel className="flex gap-2 items-center text-sm">
                    Employee <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <EmployeeCombo
                      employeeName={resourceAllocationForm.employee_name}
                      status={["Active"]}
                      onSelect={handleEmployeeChange}
                      value={form.getValues("employee")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-x-4 grid-cols-7">
              <FormField
                control={form.control}
                name="customer"
                render={() => (
                  <FormItem className="space-y-1 col-span-3">
                    <FormLabel>
                      Customer <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <ComboBox
                        isLoading={isCustomerLoading}
                        label="Search Customer"
                        onSelect={(value) => {
                          handleSearchChange("customer", value, setCustomerSearch);
                          fetchProjects();
                          form.setValue("project", "", {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                          setProjectSearch("");
                        }}
                        onSearch={(value) => {
                          setCustomerSearch(value);
                        }}
                        showSelected
                        shouldFilter
                        value={
                          form.getValues("customer") && form.getValues("customer").length > 0
                            ? [form.getValues("customer")]
                            : []
                        }
                        data={customers?.message?.map((item: { customer_name: string; name: string }) => ({
                          label: item.customer_name,
                          value: item.name,
                          disabled: false,
                        }))}
                        rightIcon={<Search className="!h-4 !w-4 stroke-slate-400" />}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="project"
                render={() => (
                  <FormItem className="space-y-1 col-span-3">
                    <FormLabel>Projects</FormLabel>
                    <ComboBox
                      isLoading={isProjectLoading}
                      label={
                        form.getValues("customer")
                          ? "Search " + form.getValues("customer") + " Projects"
                          : "Search Projects"
                      }
                      onSelect={(value) => {
                        handleSearchChange("project", value, setProjectSearch);
                      }}
                      onSearch={(value) => setProjectSearch(value)}
                      showSelected
                      shouldFilter
                      value={
                        form.getValues("project") && form.getValues("project").length > 0
                          ? [form.getValues("project")]
                          : []
                      }
                      data={projects?.message?.map((item: { project_name: string; name: string }) => ({
                        label: item.project_name,
                        value: item.name,
                        disabled: false,
                      }))}
                      rightIcon={<Search className="h-4 w-4 stroke-slate-400" />}
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_billable"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex gap-2 h-[20px] items-center text-sm"></FormLabel>
                    <FormControl>
                      <div
                        className={mergeClassNames(
                          "flex items-center justify-center cursor-pointer rounded-sm py-3 px-1",
                          field.value ? "bg-gradient-to-r from-green-400 to-green-600" : "bg-yellow-500"
                        )}
                        onClick={() =>
                          form.setValue("is_billable", !field.value, {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          })
                        }
                      >
                        <CircleDollarSign size={36} className="text-white" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-x-4 grid-cols-2">
              <FormField
                control={form.control}
                name="allocation_start_date"
                render={({ field }) => (
                  <FormItem className="w-full space-y-1">
                    <FormLabel className="flex gap-2 items-center text-sm">
                      Start Date<span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={(date: Date) => handleDateChange("allocation_start_date", date)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allocation_end_date"
                render={({ field }) => (
                  <FormItem className="w-full space-y-1">
                    <FormLabel className="flex gap-2 items-center text-sm">
                      End Date<span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={(date: Date) => handleDateChange("allocation_end_date", date)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!resourceDialogState.isNeedToEdit && (
              <div>
                <FormField
                  control={form.control}
                  name="repeat_till_week_count"
                  render={({ field }) => (
                    <FormItem className="w-full space-y-1">
                      <FormControl>
                        <div className="flex items-center w-full gap-1">
                          <Typography variant="p">Repeat weekly for </Typography>

                          <Input
                            placeholder="0"
                            className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 w-16"
                            type="text"
                            {...field}
                            onChange={(e) => {
                              const number = parseInt(e.target.value);
                              if (number) {
                                form.setValue("repeat_till_week_count", number, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true,
                                });
                              } else {
                                form.setValue("repeat_till_week_count", 0, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true,
                                });
                              }
                            }}
                            disabled={!enableRepeatOnWeek}
                          />
                          <Typography variant="p">weeks</Typography>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid gap-x-4 grid-cols-2">
              <FormField
                control={form.control}
                name="total_allocated_hours"
                render={({ field }) => (
                  <FormItem className="w-full space-y-1">
                    <FormLabel className="flex gap-2 items-center">
                      <Typography variant="small">Total Hours</Typography>
                    </FormLabel>
                    <FormControl>
                      <>
                        <div className="flex items-center relative">
                          <Input
                            placeholder="0"
                            className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            type="text"
                            {...field}
                            onChange={(e) => {
                              form.setValue("total_allocated_hours", handleNumberInputValue(String(e.target.value)), {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true,
                              });
                              handleHoursAutoComplete("per_day");
                            }}
                          />
                          <Clock3 className="h-4 w-4 absolute right-0 m-3 top-0 stroke-slate-400" />
                        </div>
                        <div className="h-[16px]">
                          {leaveData?.message && isNeedToShowLeaveData() && (
                            <p
                              className="text-[10px] pl-1"
                              title="Note: Leave days include the days when employee is on leave and holiday days"
                            >
                              {leaveData?.message
                                ? `Total Days: ${leaveData.message.total_days}, Working Days: ${leaveData.message.total_working_days}, Leave Days: ${leaveData.message.leave_days}`
                                : "Total Days: 0, Working Days: 0, Leave Days: 0"}
                            </p>
                          )}
                        </div>
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hours_allocated_per_day"
                render={({ field }) => (
                  <FormItem className="w-full space-y-1">
                    <FormLabel className="flex gap-2 items-center">
                      <Typography variant="small">
                        Hours / Day <span className="text-red-400">*</span>
                      </Typography>
                    </FormLabel>
                    <FormControl>
                      <>
                        <div className="flex items-center relative">
                          <Input
                            placeholder="0"
                            className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            type="text"
                            {...field}
                            onChange={(e) => {
                              form.setValue("hours_allocated_per_day", handleNumberInputValue(String(e.target.value)), {
                                shouldValidate: true,
                                shouldDirty: true,
                                shouldTouch: true,
                              });
                              handleHoursAutoComplete("total");
                            }}
                          />
                          <Clock3 className="h-4 w-4 absolute right-0 m-3 top-0 stroke-slate-400" />
                        </div>
                      </>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <TextArea
                      placeholder="Put Note here..."
                      rows={4}
                      className="w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-start w-full pt-3">
              <div className="flex gap-x-4 w-full">
                <Button disabled={!form.formState.isDirty || !form.formState.isValid || loading}>
                  {loading ? <LoaderCircle className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {resourceDialogState.isNeedToEdit ? "Save" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    handleOpen(false);
                  }}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddResourceAllocations;
