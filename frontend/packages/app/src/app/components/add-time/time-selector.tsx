/**
 * External Dependencies
 */
import { useState } from "react";
import { floatToTime } from "@next-pms/design-system";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Typography,
} from "@next-pms/design-system/components";
import { Clock3, PlusCircle } from "lucide-react";
/**
 * Internal Dependencies
 */
import { CustomTime } from "@/lib/constant";
import { getLocalStorage, setLocalStorage } from "@/lib/storage";
import { formatTime } from "@/lib/utils";
interface TimeSelectorProps {
  onClick?: (time: string) => void;
}
const TimeSelector = ({ onClick }: TimeSelectorProps) => {
  const [shouldOpen, setShouldOpen] = useState(false);
  const time = [...(getLocalStorage("customTime") || []), ...CustomTime].sort(
    (a, b) => {
      const timeA = a.split(":").map(Number);
      const timeB = b.split(":").map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    },
  );
  return (
    <>
      <AddCustomTime setOpen={setShouldOpen} isOpen={shouldOpen} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className=" border-0 hover:bg-transparent group"
          >
            <Clock3 className="stroke-slate-400 group-hover:stroke-primary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="p-0 z-[1001]  w-fit min-w-0">
          <div className="max-h-40 overflow-y-auto">
            {time.map((time) => (
              <DropdownMenuItem
                key={time}
                className="cursor-pointer w-fit px-2 hover:bg-accent"
                onClick={() => onClick?.(time)}
              >
                {time}
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuItem
            key="custom"
            onClick={() => {
              setShouldOpen(true);
            }}
            className="cursor-pointer flex items-center justify-center px-2 hover:bg-accent border-t rounded-none"
          >
            <PlusCircle />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

const AddCustomTime = ({
  isOpen,
  setOpen,
}: {
  isOpen: boolean;
  setOpen: (value: React.SetStateAction<boolean>) => void;
}) => {
  const customTime = getLocalStorage("customTime") || [];
  const handleAddCustomTime = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key != "Enter") return;
    let time = event.currentTarget.value.trim();
    if (!time.includes(":")) {
      time = floatToTime(Number(time), 2, 2);
    }
    time = formatTime(time);
    if (time && !customTime.includes(time) && !CustomTime.includes(time)) {
      const updatedCustomTime = [...customTime, time];
      setLocalStorage("customTime", updatedCustomTime);
    }
    setOpen(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="z-1001 ">
        <DialogHeader>
          <DialogTitle>Add Custom Time</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Enter custom time(01:00 or 1)"
          required
          onKeyDown={handleAddCustomTime}
        />
        <Typography variant="small">Press Enter to save</Typography>
      </DialogContent>
    </Dialog>
  );
};
export default TimeSelector;
