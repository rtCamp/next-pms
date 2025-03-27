/**
 * External dependencies
 */
import { useState, useCallback, useEffect, useContext } from "react";
import {
  Button,
  Checkbox,
  ComboBox,
  DeBouncedInput,
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
} from "@next-pms/design-system/components";
import { FrappeConfig, FrappeContext, useFrappeGetCall } from "frappe-react-sdk";
import { Calendar, Clock, ArrowLeft, X, Save, Search } from "lucide-react";

/**
 * Internal dependencies
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { TaskData } from "@/types";
import { Event } from "./types";

interface ImportFromGoogleCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean | null) => void;
  ignoreAlldayEvents?: boolean;
}

const ImportFromGoogleCalendarDialog: React.FC<ImportFromGoogleCalendarDialogProps> = ({
  open,
  onOpenChange,
  ignoreAlldayEvents = true,
}) => {
  const {
    data: eventData,
    isLoading,
    error,
  } = useFrappeGetCall("frappe.desk.doctype.event.event.get_events", {
    start: "2025-03-24",
    end: "2025-03-30",
  });
  const [dialogStage, setDialogStage] = useState<"search" | "eventDetails">("search");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tasks, setTasks] = useState([]);
  const [searchTask, setSearchTask] = useState("");
  const [selectedTask, setSelectedTask] = useState<string | string[]>("");
  const [selectedProject, setSelectedProject] = useState<string | string[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [recurringEvents, setRecurringEvents] = useState<Event[]>([]);
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const { toast } = useToast();

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

  const { data: projects, isLoading: isProjectLoading } = useFrappeGetCall("frappe.client.get_list", {
    doctype: "Project",
    fields: ["name", "project_name"],
    limit_page_length: "null",
  });

  useEffect(() => {
    if (eventData) {
      const filteredEvents = eventData?.message?.filter((event: Event) => {
        if (ignoreAlldayEvents && event.all_day == 1) {
          return false;
        }
        return true;
      });
      setFilteredEvents(filteredEvents);
    }
    if (error) {
      //
    }
  }, [eventData, error, ignoreAlldayEvents]);

  const handleOpen = () => {
    onOpenChange(null);
  };

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery]);

  const handleSearch = useCallback(
    (query: string) => {
      const filtered = eventData?.message?.filter((event: Event) => {
        const subjectMatches = event.subject.toLowerCase().includes(query.toLowerCase());

        if (ignoreAlldayEvents) {
          return subjectMatches && (!event.all_day || event.all_day !== 1);
        }

        return subjectMatches;
      });

      setFilteredEvents(filtered || []);
    },
    [eventData, ignoreAlldayEvents]
  );

  const handleEventClick = useCallback(
    (event: Event) => {
      setSelectedEvent(event);
      // Get similar events with the same subject
      const similarEvents = eventData?.message
        ?.filter((e: Event) => e.subject === event.subject)
        // Remove duplicates based on starts_on and ends_on
        .filter(
          (e: Event, index: number, self: Event[]) =>
            index === self.findIndex((t) => t.starts_on === e.starts_on && t.ends_on === e.ends_on)
        )
        .map((e: Event) => ({ ...e, selected: false }));

      setRecurringEvents(similarEvents);
      setDialogStage("eventDetails");
      setIsAllSelected(false);
    },
    [eventData]
  );

  const toggleEventSelection = useCallback(
    (eventId: string) => {
      const updatedEvents = recurringEvents.map((event) =>
        event.name === eventId ? { ...event, selected: !event.selected } : event
      );
      setRecurringEvents(updatedEvents);
      setIsAllSelected(updatedEvents.every((e) => e.selected));
    },
    [recurringEvents]
  );

  const toggleSelectAll = useCallback(() => {
    const newSelectedState = !isAllSelected;
    setIsAllSelected(newSelectedState);
    setRecurringEvents((prev) => prev.map((event) => ({ ...event, selected: newSelectedState })));
  }, [isAllSelected]);

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
    [selectedProject, tasks]
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

  const handleCreateTask = useCallback(() => {
    const selectedEvents = recurringEvents.filter((event) => event.selected);
    console.log("Creating task", {
      taskType: selectedTask,
      project: selectedProject,
      events: selectedEvents,
    });
  }, [selectedTask, selectedProject, recurringEvents]);

  const renderSearchStage = () => {
    return (
      <>
        {!isLoading ? (
          <>
            {/* Search Input */}
            <div className="flex items-center space-x-2">
              <DeBouncedInput
                placeholder="Search meetings..."
                value={searchQuery}
                deBounceValue={0}
                callback={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchQuery(e.target.value);
                }}
                className="max-w-full"
              />
            </div>

            {/* Timeline View of Events */}
            <div className="h-80 overflow-y-auto">
              {filteredEvents?.length > 0 ? (
                <div className="relative border-l-2 border-gray-200 ml-4">
                  {filteredEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center mb-4 pl-6 cursor-pointer group"
                      onClick={() => handleEventClick(event)}
                    >
                      {/* Timeline Dot */}
                      <div className="absolute -left-[0.325rem] size-[.65rem] bg-gray-400 rounded-full transition-colors"></div>

                      {/* Event Card */}
                      <div className="flex-1 p-3 border rounded-md hover:bg-gray-50 hover:border-gray-500 transition-colors">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold transition-colors">{event.subject}</h3>
                            <div className="text-sm text-gray-500 flex items-center space-x-2">
                              <Calendar size={14} />
                              <span>{new Date(event.starts_on).toLocaleDateString()}</span>
                              <Clock size={14} />
                              <span>
                                {new Date(event.starts_on).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                -{" "}
                                {new Date(event.ends_on).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowLeft className="text-gray-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full w-full justify-center items-center text-center py-8 text-muted-foreground">
                  No events found. Try a different search term.
                </div>
              )}
            </div>
          </>
        ) : (
          <Spinner isFull={true} className="h-80" />
        )}
      </>
    );
  };

  const renderEventDetailsStage = () => {
    return (
      <>
        {/* Back Button and Event Name */}
        <div className="flex gap-2 items-center mb-4">
          <ArrowLeft
            className="cursor-pointer text-gray-500 hover:text-gray-600 transition-colors"
            onClick={() => {
              setDialogStage("search");
              setSelectedProject([]);
              setSelectedTask([]);
              setSearchTask("");
            }}
          />
          <div className="w-full ml-0  truncate">
            <h2 className="text-lg font-semibold">{selectedEvent?.subject}</h2>
          </div>
        </div>

        {/* Select All Checkbox */}
        <div className="flex items-center space-x-3 p-3  rounded-md bg-gray-50">
          <Checkbox id="select_all" checked={isAllSelected} onCheckedChange={toggleSelectAll} />
          <Label htmlFor="select_all" className="font-medium">
            Select All Events
          </Label>
        </div>

        {/* Recurring Events List */}
        <div className="space-y-4 md:max-h-60 max-md:max-h-44 overflow-y-auto">
          {recurringEvents?.map((event, idx) => (
            <div
              key={idx}
              onClick={() => toggleEventSelection(event.name)}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-500 cursor-pointer transition-colors group"
            >
              <Checkbox checked={event.selected} />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{event.subject}</h3>
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <Calendar size={14} />
                      <span>{new Date(event.starts_on).toLocaleDateString()}</span>
                      <Clock size={14} />
                      <span>
                        {new Date(event.starts_on).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                        {new Date(event.ends_on).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              data={projects?.message?.map((item: { project_name: string; name: string }) => ({
                label: item.project_name,
                value: item.name,
                disabled: false,
              }))}
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
              value={selectedTask && selectedTask.length > 0 ? [selectedTask[0]] : []}
              isLoading={isTaskLoading}
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
              rightIcon={<Search className="h-4 w-4  stroke-slate-400" />}
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="Content" className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex gap-x-2">Create Task from Google Calendar</DialogTitle>
        </DialogHeader>
        <Separator />

        {dialogStage === "search" ? renderSearchStage() : renderEventDetailsStage()}

        <DialogFooter className="sm:justify-start w-full pt-3">
          <div className="flex gap-x-4 w-full">
            <Button variant="secondary" type="button" onClick={handleOpen}>
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!selectedTask || !selectedProject || !recurringEvents.some((e) => e.selected)}
            >
              <Save className="w-4 h-4" />
              Add Time
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportFromGoogleCalendarDialog;
