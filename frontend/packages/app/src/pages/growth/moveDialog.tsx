/**
 * External dependencies.
 */
import { useState } from "react";
import {
  Button,
  Dialog,
  ErrorMessage,
  Select,
  TextEditor,
  TextInput,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { ArrowRight } from "@rtcamp/frappe-ui-react/icons";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import {
  CLIENT_PRIORITY_OPTIONS,
  FORM_EDITOR_CLASS,
  FORM_INPUT_CLASS,
} from "@/pages/project-details/tabs/growth/constants";
import { StatusBadge } from "@/pages/project-details/tabs/growth/list/cells/statusBadge";
import { MOVE_STAGE_METHOD, NO_CLIENT_LABEL } from "./constants";
import { usePipeline } from "./context";
import type { PendingMove } from "./types";

interface MoveDialogProps {
  move: PendingMove;
}

export function MoveDialog({ move }: MoveDialogProps) {
  const { initiative, status, closedStatus } = move;
  const clients = usePipeline((c) => c.state.clients);
  const cancelMove = usePipeline((c) => c.actions.cancelMove);
  const refresh = usePipeline((c) => c.actions.refresh);
  const { call, loading } = useFrappePostCall(MOVE_STAGE_METHOD);
  const toast = useToasts();
  const [billableOutcome, setBillableOutcome] = useState(
    String(initiative.billable_outcome ?? 0),
  );
  const [priority, setPriority] = useState(initiative.client_priority ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const target = closedStatus ?? status;
  const from = initiative.is_closed
    ? (initiative.closed_status ?? initiative.status)
    : initiative.status;
  const clientName = initiative.customer
    ? (clients[initiative.customer]?.customer_name ?? initiative.customer)
    : NO_CLIENT_LABEL;

  const submit = async () => {
    if (billableOutcome !== "" && Number(billableOutcome) < 0) {
      setError("Billable outcome must be zero or greater.");
      return;
    }
    try {
      await call({
        name: initiative.name,
        status,
        closed_status: closedStatus,
        billable_outcome: billableOutcome === "" ? null : billableOutcome,
        client_priority: priority,
        note,
      });
      toast.success(`Moved to ${target}`);
      refresh();
      cancelMove();
    } catch (err) {
      setError(parseFrappeErrorMsg(err as FrappeError));
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && cancelMove()}
      options={{
        title: closedStatus ? `Close as ${closedStatus}` : `Move to ${status}`,
        size: "md",
      }}
      actions={
        <div className="flex w-full justify-end gap-2">
          <Button
            variant="subtle"
            label="Cancel"
            onClick={cancelMove}
            disabled={loading}
          />
          <Button
            variant="solid"
            label={closedStatus ? "Close" : "Move"}
            onClick={() => void submit()}
            loading={loading}
            disabled={loading}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-gray-5 wrap-break-word">
          {initiative.activity} · {clientName}
        </p>
        <div className="flex items-center gap-2 text-sm text-ink-gray-7">
          <span className="rounded-full bg-surface-gray-2 px-2 py-1">
            <StatusBadge status={from} />
          </span>
          <ArrowRight className="size-4 text-ink-gray-5" aria-hidden="true" />
          <span className="rounded-full bg-surface-gray-2 px-2 py-1">
            <StatusBadge status={target} />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-base text-ink-gray-5">
            Billable outcome ({initiative.currency})
            <TextInput
              type="number"
              size="md"
              variant="outline"
              min={0}
              value={billableOutcome}
              onChange={(e) => setBillableOutcome(e.target.value)}
              className={FORM_INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-base text-ink-gray-5">
            Priority for client
            <Select
              className="text-ink-gray-7"
              variant="outline"
              options={CLIENT_PRIORITY_OPTIONS}
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              placeholder="Select priority"
            />
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-base text-ink-gray-5">Update note</span>
          <TextEditor
            placeholder="What moved it forward?"
            content={note}
            onChange={setNote}
            fixedMenu={false}
            editorClass={FORM_EDITOR_CLASS}
          />
        </div>
        <p className="text-sm text-ink-gray-5">
          Saved as a status update, so the Updates history stays complete.
        </p>
        {error && <ErrorMessage message={error} />}
      </div>
    </Dialog>
  );
}
