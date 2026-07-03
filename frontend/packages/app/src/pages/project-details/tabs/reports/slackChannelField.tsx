/**
 * External dependencies.
 */
import { useEffect, useState } from "react";
import {
  Button,
  Combobox,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import {
  FrappeError,
  useFrappeGetDocList,
  useFrappeUpdateDoc,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "../../context";

interface SlackChannelFieldProps {
  disabled?: boolean;
}

export function SlackChannelField({ disabled }: SlackChannelFieldProps) {
  const { project, projectId, mutate } = useProjectDetail((state) => state);
  const toast = useToasts();
  const { updateDoc, loading: saving } = useFrappeUpdateDoc();

  const savedSlug = project?.custom_slack_channel_slug ?? "";

  const [isEditing, setIsEditing] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(savedSlug);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: channels, isLoading } = useFrappeGetDocList<{
    name: string;
    channel_name: string;
  }>("Slack Channel", {
    fields: ["name", "channel_name"],
    filters: debouncedSearch
      ? [["channel_name", "like", `%${debouncedSearch}%`]]
      : [],
    orderBy: { field: "channel_name", order: "asc" },
    limit: 20,
  });

  const options = (channels ?? []).map((channel) => ({
    label: channel.channel_name,
    value: channel.name,
  }));

  const startEditing = () => {
    setSelectedSlug(savedSlug);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setSelectedSlug(savedSlug);
    setSearch("");
    setDebouncedSearch("");
    setIsEditing(false);
  };

  const save = async () => {
    if (!selectedSlug) {
      toast.error("Please select a Slack channel");
      return;
    }
    try {
      await updateDoc("Project", projectId, {
        custom_slack_channel_slug: selectedSlug,
      });
      mutate();
      setSearch("");
      setDebouncedSearch("");
      setIsEditing(false);
      toast.success("Slack channel saved");
    } catch (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <TextInput className="flex-1" value={savedSlug || "Not set"} disabled />
        <Button variant="ghost" onClick={startEditing} disabled={disabled}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Combobox
        className="flex-1"
        options={options}
        value={selectedSlug}
        searchValue={search}
        onChange={(value) => setSelectedSlug(value ?? "")}
        onSearchChange={setSearch}
        loading={isLoading}
        placeholder="Search Slack channel"
        openOnFocus
      />
      <Button variant="solid" onClick={save} loading={saving}>
        Save
      </Button>
      <Button variant="subtle" onClick={cancelEditing} disabled={saving}>
        Cancel
      </Button>
    </div>
  );
}
