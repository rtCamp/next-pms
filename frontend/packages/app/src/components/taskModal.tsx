import { ProgressV2 } from "@next-pms/design-system/components";
import { Avatar, Badge, Dialog, Select } from "@rtcamp/frappe-ui-react";
import { Calendar, Folder, Loader } from "lucide-react";

const TaskModal = () => {
  return (
    <Dialog
      open={true}
      // open={false}
      onOpenChange={() => {}}
      options={{
        title: () => {
          return (
            <div className="flex items-center gap-x-2 gap-y-1.5">
              <Loader size={16} className="w-full shrink-0" />
              <div className="text-lg font-semibold">
                Design system component refinements
              </div>
            </div>
          );
        },
        size: "md",
      }}
    >
      <div className="flex flex-wrap gap-1 -mt-5.5 ml-6">
        <Badge variant="subtle" size="md" prefix={<Calendar size={12} />}>
          23 Jan
        </Badge>
        <Badge variant="subtle" size="md" prefix={<Folder size={12} />}>
          Social media strategy alignment
        </Badge>
      </div>

      <div className="flex justify-between mt-4 text-base">
        <div className="flex gap-0.75 mb-0.5">
          <div className="flex gap-1">
            <span>11:30</span>
            <span className="text-ink-gray-5">Actual</span>
          </div>
          <span className="text-ink-gray-5">/</span>
          <div className="flex gap-1">
            <span>10:00</span>
            <span className="text-ink-gray-5">Est.</span>
          </div>
        </div>

        <div className="text-ink-gray-6">123%</div>
      </div>

      <ProgressV2 value={180} size="lg" className="mt-2.5" />

      <div className="flex justify-between items-center mt-6">
        <div className="flex justify-between items-center rounded bg-surface-gray-2 px-2 py-1.5 gap-1">
          <Avatar size="xs" label="PK" />
          <span className="text-base">06:00</span>
        </div>

        <Select
          className="w-auto"
          onChange={() => {}}
          options={[
            {
              label: "Last 30 days",
              value: "last-30-days",
            },
            {
              label: "Last month",
              value: "last-month",
            },
            {
              label: "Last 3 months",
              value: "last-3-months",
            },
          ]}
          placeholder="Select option"
          value="last-30-days"
        />
      </div>

      <div className="flex overflow-y-auto flex-col gap-3 mt-3 h-54">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="pb-3 border-b border-outline-gray-modals text-ink-gray-6 last:border-none"
          >
            <div className="flex justify-between items-center">
              <Badge variant="subtle" size="md">
                01:30
              </Badge>
              <span className="text-base">23 Jan</span>
            </div>

            <p className="mt-1 text-base">
              Updated button variants, adjusted hover states and padding
            </p>
          </div>
        ))}
      </div>
    </Dialog>
  );
};

export default TaskModal;
