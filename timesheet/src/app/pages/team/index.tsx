import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { ComboxBox } from "@/app/components/comboBox";
import { useFrappeGetCall } from "frappe-react-sdk";

type ProjectProps = {
    project_name: string;
    name: string;
}

const Team = () => {
  const { data: projects } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name"],
  });
  const approvals = [
    { label: "Not Submitted", value: "Not Submitted" },
    { label: "Approval Pending", value: "Approval Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
  ];

  return (
    <>
      <div className="flex gap-x-2 items-center justify-between">
        <div id="filters" className="flex gap-x-2">
          <ComboxBox
            label="Approval"
            data={approvals}
            isMulti
            leftIcon={<Filter className="h-4 w-4" />}
            className="text-primary border-dashed gap-x-2 font-normal"
          />
          <ComboxBox
            label="Team Groups"
            isMulti
            leftIcon={<Filter className="h-4 w-4" />}
            data={projects?.message.map((item:ProjectProps) => ({
              label: item.project_name,
              value: item.name,
            }))}
            className="text-primary border-dashed gap-x-2 font-normal"
          />
        </div>
        <div id="date-filter" className="flex gap-x-2">
          <Button className="p-1 h-fit" variant="outline">
            <ChevronLeft />
          </Button>
          <Button className="p-1 h-fit" variant="outline">
            <ChevronRight />
          </Button>
        </div>
      </div>
    </>
  );
};

export default Team;
