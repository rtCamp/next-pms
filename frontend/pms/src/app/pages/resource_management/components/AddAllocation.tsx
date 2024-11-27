// interface AddTimeProps {}

import { ComboxBox } from "@/app/components/comboBox";
import EmployeeCombo from "@/app/components/employeeComboBox";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Separator } from "@/app/components/ui/separator";
import { Textarea } from "@/app/components/ui/textarea";
import { getFormatedDate } from "@/lib/utils";
import { ResourceAllocationSchema } from "@/schema/resource";
import { RootState } from "@/store";
import { AllocationDataProps, ResourceKeys, setDialog } from "@/store/resource_management/allocation";
import { Clock3, LoaderCircle, Save, Search, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { z } from "zod";
import { DatePicker } from "@/app/components/datePicker";
import { useFrappeCreateDoc, useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";
import { useState } from "react";
import { useToast } from "@/app/components/ui/use-toast";
import { resetState } from "@/store/resource_management/allocation";
import { setReFetchData } from "@/store/resource_management/team";

const AddResourceAllocations = () => {
  const ResourceAllocationForm: AllocationDataProps = useSelector((state: RootState) => state.resource_allocation_form);
  const dispatch = useDispatch();

  const [projectSearch, setProjectSearch] = useState(ResourceAllocationForm.project_name);
  const [customerSearch, setCustomerSearch] = useState(ResourceAllocationForm.customer_name);

  const { data: projects } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    filters: [["project_name", "like", `%${projectSearch}%`]],
    fields: ["name", "project_name"],
    limit_page_length: 20,
  });

  const { data: customers } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Customer",
    filters: { customer_name: ["like", `%${customerSearch}%`] },
    fields: ["name", "customer_name"],
    limit_page_length: 20,
  });

  const { toast } = useToast();

  const { createDoc: createAllocations, loading: loadingCreation } = useFrappeCreateDoc();
  const { updateDoc: updateAllocations, loading: loadingUpdation } = useFrappeUpdateDoc();

  const form = useForm<z.infer<typeof ResourceAllocationSchema>>({
    resolver: zodResolver(ResourceAllocationSchema),
    defaultValues: {
      employee: ResourceAllocationForm.employee,
      is_billable: ResourceAllocationForm.is_billable,
      project: ResourceAllocationForm.project,
      project_name: ResourceAllocationForm.project_name,
      customer: ResourceAllocationForm.customer,
      customer_name: ResourceAllocationForm.customer_name,
      total_allocated_hours: ResourceAllocationForm.total_allocated_hours,
      hours_allocated_per_day: ResourceAllocationForm.hours_allocated_per_day,
      allocation_start_date: ResourceAllocationForm.allocation_start_date,
      allocation_end_date: ResourceAllocationForm.allocation_end_date,
      note: ResourceAllocationForm.note,
    },
    mode: "onSubmit",
  });

  const handleEmployeeChange = (value: string) => {
    form.setValue("employee", value);
  };
  const handleSearchChange = (key: ResourceKeys, value: string | string[], handleValueChange) => {
    if (typeof value === "string") {
      form.setValue(key, value);
      if (!value) {
        handleValueChange("");
      }
    }
    if (value.length > 0) {
      form.setValue(key, value[0]);
    } else {
      form.setValue(key, "");
      handleValueChange("");
    }
  };

  const handleDateChange = (key: ResourceKeys, date: Date | undefined) => {
    if (!date) return;
    form.setValue(key, getFormatedDate(date));
  };

  const handleOpen = (open: boolean): void => {
    dispatch(setDialog(open));
    if (open === false) {
      form.reset();
      dispatch(resetState());
    }
  };

  const getAllocationApi = (data: AllocationDataProps) => {
    const doctypeDoc = {
      employee: data.employee,
      project: data.project,
      customer: data.customer,
      total_allocated_hours: data.total_allocated_hours,
      hours_allocated_per_day: data.hours_allocated_per_day,
      allocation_start_date: data.allocation_start_date,
      allocation_end_date: data.allocation_end_date,
      note: data.note,
    };
    if (ResourceAllocationForm.isNeedToEdit) {
      return updateAllocations("Resource Allocation", ResourceAllocationForm.name, doctypeDoc);
    }
    return createAllocations("Resource Allocation", doctypeDoc);
  };

  const handleSubmit = (data: AllocationDataProps) => {
    if (!data) {
      return;
    }
    getAllocationApi(data)
      .then(() => {
        toast({
          variant: "success",
          description: `Resouce allocation ${ResourceAllocationForm.isNeedToEdit ? "updated" : "created"} successfully`,
        });
        handleOpen(false);
        form.reset();
        dispatch(setReFetchData(true));
      })
      .catch(() => {
        toast({
          variant: "destructive",
          description: `Failed to ${ResourceAllocationForm.isNeedToEdit ? "updated" : "create"} resource allocation`,
        });
      });
  };

  console.log(form.getValues("customer"), customerSearch, "custom");
  console.log(form.getValues("project"), projectSearch, "project");

  return (
    <Dialog open={ResourceAllocationForm?.isShowDialog} onOpenChange={handleOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex gap-x-2 mb-2">
            {ResourceAllocationForm.isNeedToEdit ? "Edit" : "Add"} Allocation
          </DialogTitle>
          <Separator />
        </DialogHeader>
        <Form {...form}>
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
                    <EmployeeCombo onSelect={handleEmployeeChange} value={form.getValues("employee")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-x-4 grid-cols-2">
              <FormField
                control={form.control}
                name="customer"
                render={() => (
                  <FormItem className="space-y-1">
                    <FormLabel>
                      Customer <span className="text-red-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <ComboxBox
                        label="Search Customer"
                        onSelect={(value) => {
                          handleSearchChange("customer", value, setCustomerSearch);
                        }}
                        onSearch={(value) => {
                          setCustomerSearch(value);
                        }}
                        showSelected
                        deBounceTime={200}
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
                  <FormItem className="space-y-1">
                    <FormLabel>Projects</FormLabel>
                    <ComboxBox
                      label="Search Projects"
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

            <div className="grid gap-x-4 grid-cols-2">
              <FormField
                control={form.control}
                name="total_allocated_hours"
                render={({ field }) => (
                  <FormItem className="w-full space-y-1">
                    <FormLabel className="flex gap-2 items-center">
                      <p className="text-sm">Total Hours</p>
                    </FormLabel>
                    <FormControl>
                      <>
                        <div className="relative flex items-center">
                          <Input
                            placeholder="00:00"
                            className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            type="text"
                            {...field}
                          />
                          <Clock3 className="h-4 w-4 absolute right-0 m-3 top-0 stroke-slate-400" />
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
                      <p className="text-sm">
                        Hours / Day <span className="text-red-400">*</span>
                      </p>
                    </FormLabel>
                    <FormControl>
                      <>
                        <div className="relative flex items-center">
                          <Input
                            placeholder="00:00"
                            className="placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                            type="text"
                            {...field}
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
                    <Textarea
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
                <Button>
                  {loadingCreation || loadingUpdation ? (
                    <LoaderCircle className="animate-spin w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {ResourceAllocationForm.isNeedToEdit ? "Save" : "Create"}
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
