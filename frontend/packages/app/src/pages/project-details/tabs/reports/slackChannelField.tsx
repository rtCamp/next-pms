/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { Button, Combobox, useToasts } from "@rtcamp/frappe-ui-react";
import { EditAlt, Check, Close } from "@rtcamp/frappe-ui-react/icons";
import type { FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useSlackChannelLookup } from "@/hooks/useSlackChannelLookup";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { Field } from "./field";
import { useProjectDetail } from "../../context";

export function SlackChannelField() {
  const toast = useToasts();
  const slackChannel = useProjectDetail(
    (state) => state.project?.custom_slack_channel_slug ?? "",
  );
  const updateSlackChannel = useProjectDetail(
    (state) => state.updateSlackChannel,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(slackChannel);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentValue = isEditing ? draft : slackChannel;
  const selectedOption = useMemo(
    () => (currentValue ? { label: currentValue, value: currentValue } : null),
    [currentValue],
  );

  const { options, isLoading } = useSlackChannelLookup({
    shouldFetch: isEditing,
    query: search,
    selectedOption,
  });

  const startEditing = () => {
    setDraft(slackChannel);
    setSearch("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(slackChannel);
    setSearch("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSlackChannel(draft);
      toast.success("Slack channel updated");
      setIsEditing(false);
    } catch (error) {
      toast.error(parseFrappeErrorMsg(error as FrappeError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Field label="Slack Channel">
      <div className="flex items-center gap-2">
        <Combobox
          className="flex-1"
          options={options}
          value={currentValue || null}
          searchValue={search}
          loading={isLoading}
          disabled={!isEditing || isSaving}
          placeholder={isEditing ? "Select channel" : "Not set"}
          emptyMessage="No channels found"
          openOnFocus
          onSearchChange={setSearch}
          onChange={(value) => setDraft(value ?? "")}
        />
        {isEditing ? (
          <>
            <Button
              type="button"
              variant="ghost"
              loading={isSaving}
              icon={() => <Check size={16} className="text-ink-green-4" />}
              onClick={handleSave}
            />
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              icon={() => <Close size={16} className="text-ink-gray-5" />}
              onClick={cancelEditing}
            />
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            icon={() => <EditAlt size={16} className="text-ink-gray-7" />}
            onClick={startEditing}
          />
        )}
      </div>
    </Field>
  );
}
