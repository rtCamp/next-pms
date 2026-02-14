/**
 * External dependencies
 */
import { useState, useCallback, useEffect, useContext } from "react";
import {
  Button,
  Checkbox,
  ComboBox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Separator,
  Spinner,
  Typography,
  useToast,
  DatePicker,
} from "@next-pms/design-system/components";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system/date";
import { addDays } from "date-fns";
import {
  FrappeConfig,
  FrappeContext,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";
import { Calendar, Clock, X, Save, Search } from "lucide-react";
/**
 * Internal dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { TaskData } from "@/types";
import { Event } from "./types";

interface ImportFromGoogleCalendarDialogProps {
  open: boolean;
  onOpenChange: (date: string | null) => void;
  ignoreAlldayEvents?: boolean;
}

const ImportFromGoogleCalendarDialog: React.FC<
  ImportFromGoogleCalendarDialogProps
> = ({ open, onOpenChange, ignoreAlldayEvents = true }) => {
  const [startDate, setStartDate] = useState<string>(getTodayDate());

  const [endDate, setEndDate] = useState<string>(
    getFormatedDate(addDays(getTodayDate(), 7)),
  );

  const {
    data: eventData,
    isLoading,
    error: eventError,
  } = useFrappeGetCall(
    "next_pms.api.get_user_calendar_events",
    {
      start_date: startDate,
      end_date: endDate,
    },
    undefined,
    {
      errorRetryCount: 0,
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  );

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);
  const [tasks, setTasks] = useState([]);
  const [searchTask, setSearchTask] = useState("");
  const [selectedTask, setSelectedTask] = useState<string | string[]>("");
  const [selectedProject, setSelectedProject] = useState<string | string[]>([]);
  const [isTaskLoading, setIsTaskLoading] = useState(false);

  const { call } = useContext(FrappeContext) as FrappeConfig;
  const { toast } = useToast();

  const { call: bulkSave, loading: isSaving } = useFrappePostCall(
    "next_pms.timesheet.api.timesheet.bulk_save",
  );

  const { data: projects, isLoading: isProjectLoading } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Project",
      fields: ["name", "project_name"],
      limit_page_length: "null",
    },
  );

  const fetchTask = useCallback(() => {
    setIsTaskLoading(true);
    call
      .get("next_pms.timesheet.api.task.get_task_list", {
        search: searchTask,
        projects: selectedProject,
        page_length: 100,
      })
      .then((res) => {
        setTasks(res.message.task);
        setIsTaskLoading(false);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
        setIsTaskLoading(false);
      });
  }, [call, searchTask, selectedProject, toast]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask, searchTask, selectedProject]);

  useEffect(() => {
    if (eventData) {
      const filteredEvents = eventData?.message?.filter((event: Event) => {
        if (ignoreAlldayEvents && event.all_day == 1) {
          return false;
        }
        return true;
      });
      setEvents(filteredEvents);
      setSelectedEvents([]);
      setIsAllSelected(false);
    }
  }, [eventData, ignoreAlldayEvents]);

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents((prev) => {
      const updatedSelection = prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId];

      setIsAllSelected(updatedSelection.length === events.length);

      return updatedSelection;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEvents([]);
      setIsAllSelected(false);
    } else {
      setSelectedEvents(events.map((event) => event.id));
      setIsAllSelected(true);
    }
  };

  const handleTaskSearch = (searchTerm: string) => {
    setSearchTask(searchTerm);
  };

  const handleTaskChange = (value: string | string[]) => {
    if (value instanceof Array) {
      setSelectedTask([value[0]]);
    } else {
      setSelectedTask(value);
    }
    updateProject(value[0]);
  };

  const updateProject = useCallback(
    (value: string) => {
      if (selectedProject.length === 0) {
        tasks.find((item: TaskData) => {
          if (item.name === value) {
            setSelectedProject([item.project]);
          }
        });
      }
    },
    [selectedProject, tasks],
  );

  const handleProjectChange = (value: string | string[]) => {
    if (value instanceof Array) {
      setSelectedProject(value);
    } else {
      setSelectedProject([value]);
    }
    setSearchTask("");
    setSelectedTask("");
  };

  const handleCreateTask = () => {
    const selectedEventDetails = events.filter((event) =>
      selectedEvents.includes(event.id),
    );
    const eventsData = selectedEventDetails.map((event) => {
      const startsOn = new Date(event.starts_on);
      const endsOn = new Date(event.ends_on);
      const durationMs = endsOn.getTime() - startsOn.getTime();
      const hours = durationMs / (1000 * 60 * 60);

      const description = `- ${event.subject} ${event.description}`.trim();

      return {
        date: startsOn.toISOString().split("T")[0],
        description: description,
        hours: Number(hours.toFixed(2)),
        task: selectedTask[0],
      };
    });

    bulkSave({ timesheet_entries: eventsData })
      .then((res) => {
        toast({
          variant: "success",
          description: res.message,
        });
        onOpenChange(startDate);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(null)}>
      <DialogContent
        aria-describedby="Content"
        className="sm:max-w-xl md:max-h-[80vh] overflow-y-auto"
      >
        <DialogHeader className="max-md:mt-2">
          <DialogTitle className="flex w-full gap-x-2 text-left">
            Import Events From Google Calendar
          </DialogTitle>
        </DialogHeader>
        <Separator />

        {/* Date Range Pickers */}
        <div className="flex justify-between gap-3 items-center w-full">
          {/* Start Date Picker */}
          <div className="w-full flex flex-col gap-2">
            <Typography className="font-medium">Start Date</Typography>
            <DatePicker
              date={startDate}
              onDateChange={(date) => {
                setStartDate(getFormatedDate(date));
                // Ensure end date is not before start date
                if (date && endDate && date > new Date(endDate)) {
                  setEndDate(getFormatedDate(date));
                }
              }}
            />
          </div>

          {/* End Date Picker */}
          <div className="w-full flex flex-col gap-2">
            <Typography className="font-medium">End Date</Typography>
            <DatePicker
              date={endDate}
              onDateChange={(date) => {
                // Ensure end date is not before start date
                if (startDate && date && date < new Date(startDate)) {
                  setStartDate(getFormatedDate(date));
                }
                setEndDate(getFormatedDate(date));
              }}
            />
          </div>
        </div>

        {eventError ? (
          <div className="text-center text-gray-700 dark:text-gray-300 py-4 flex flex-col">
            <span>{parseFrappeErrorMsg(eventError) as string | ""}</span>
            <span>
              Please configure your
              <a
                href="/app/google-calendar"
                className="ml-1 dark:hover:text-foreground hover:text-black underline cursor-pointer"
              >
                Google Calendar
              </a>
              .
            </span>
          </div>
        ) : !isLoading ? (
          <>
            <div className="flex items-center justify-between p-3 rounded-md bg-gray-100/80 dark:bg-slate-800/60">
              <span className="flex items-center space-x-3">
                <Checkbox
                  id="select_all"
                  checked={isAllSelected && events.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="select_all" className="font-medium">
                  Select All Events
                </Label>
              </span>
              <span className="text-xs font-medium">
                {events.length > 0 &&
                  `${selectedEvents.length} of ${events.length}`}
              </span>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto">
              {events?.length > 0 ? (
                events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => toggleEventSelection(event.id)}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-900/60 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                  >
                    <Checkbox checked={selectedEvents.includes(event.id)} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{event.subject}</h3>
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-4" />
                              <span className="text-xs">
                                {new Date(event.starts_on).toLocaleDateString()}
                              </span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="size-4" />
                              <span className="text-xs">
                                {new Date(event.starts_on).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}{" "}
                                -{" "}
                                {new Date(event.ends_on).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No events found for the selected date range.
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {/* Project Selection */}
              <div className="flex flex-col flex-1 gap-2">
                <Typography className="font-medium">Projects</Typography>
                <ComboBox
                  label="Search Projects"
                  showSelected
                  shouldFilter
                  value={selectedProject as string[]}
                  data={projects?.message?.map(
                    (item: { project_name: string; name: string }) => ({
                      label: item.project_name,
                      value: item.name,
                      disabled: false,
                    }),
                  )}
                  disabled={Boolean(eventError)}
                  isLoading={isProjectLoading}
                  onSelect={handleProjectChange}
                  rightIcon={<Search className="h-4 w-4 stroke-slate-400" />}
                />
              </div>
              <div className="flex flex-col flex-1 gap-2">
                <Typography className="font-medium">Tasks</Typography>
                {/* Task Type Selection */}
                <ComboBox
                  label="Search Task"
                  showSelected
                  deBounceTime={200}
                  value={
                    selectedTask && selectedTask.length > 0
                      ? [selectedTask[0]]
                      : []
                  }
                  isLoading={isTaskLoading}
                  disabled={Boolean(eventError)}
                  data={
                    tasks.map((item: TaskData) => ({
                      label: item.subject,
                      value: item.name,
                      description: item.project_name as string,
                      disabled: false,
                    })) ?? []
                  }
                  onSelect={handleTaskChange}
                  onSearch={handleTaskSearch}
                  rightIcon={<Search className="h-4 w-4 stroke-slate-400" />}
                />
              </div>
            </div>
          </>
        ) : (
          <Spinner isFull={true} className="h-80" />
        )}

        <DialogFooter className="sm:justify-start w-full pt-3">
          <div className="flex gap-x-4 w-full">
            <Button
              onClick={handleCreateTask}
              disabled={
                selectedTask.length == 0 ||
                selectedProject.length == 0 ||
                selectedEvents.length === 0 ||
                isSaving
              }
            >
              {isSaving ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Add Time
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => onOpenChange(null)}
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportFromGoogleCalendarDialog;
