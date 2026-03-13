/**
 * External Dependencies
 */
import { useState } from "react";
import { Dialog, Button, Textarea, Select, Combobox } from "@rtcamp/frappe-ui-react";
import { format, parseISO } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";

type SubmitApprovalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: string;
  endDate: string;
};

const formatWeekLabel = (startDate: string, endDate: string) => {
  try {
    const start = format(parseISO(startDate), "MMM d");
    const end = format(parseISO(endDate), "MMM d");
    return `Week of ${start} - ${end}`;
  } catch {
    return `Week of ${startDate} - ${endDate}`;
  }
};

const SubmitApproval = ({ open, onOpenChange, startDate, endDate }: SubmitApprovalProps) => {
  const [note, setNote] = useState("");

  const { data } = useFrappeGetCall("next_pms.timesheet.api.get_employee_with_role", {
    role: ["Projects Manager", "Projects User"],
  });

  const approvers = (data?.message || []).map((emp:{
    employee_name:string,
    name:string
  })=>({
    label:emp.employee_name,
    value:emp.name
  }))
  
  const [sendTo, setSendTo] = useState("");

  // Hardcoded for now
  const totalHours = "40:00";
  const weekLabel = formatWeekLabel(startDate, endDate);

  const handleSubmit = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      actions={
        <Button className="w-full" variant="solid" label="Submit" onClick={handleSubmit} />
      }
      options={{ title: "Submit for approval" }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-surface-gray-1 rounded-lg px-4 py-2.5">
          <span className="text-sm text-ink-gray-8">{weekLabel}</span>
          <span className="text-sm text-ink-green-3 font-medium">{totalHours}</span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs text-ink-gray-5">Note</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-white border-outline-gray-2"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs text-ink-gray-5">Send to</label>
          <Combobox
            value={sendTo}
            onChange={(val) => setSendTo(val as string)}
            options={approvers}
            inputClassName="bg-white h-8 border-outline-gray-2"
          />
        </div>
      </div>
    </Dialog>
  );
};

export default SubmitApproval;
