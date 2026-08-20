/**
 * External dependencies.
 */
import { useState } from "react";
import { DeleteActionDialog } from "@next-pms/design-system/components";
import { Button, StaticTextEditor } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { AddUpdateModal } from "../add-update";
import type {
  EnrichedRiskUpdateEntry,
  RiskDetail,
  FileAttachment,
} from "../types";
import { DocumentUploadButton } from "./documentUploadButton";
import { FileCard } from "./fileCard";
import { UpdateEntry } from "./updateEntry";

interface RiskDetailContentProps {
  risk: RiskDetail;
  attachments: FileAttachment[];
  mutate: () => void;
  mutateAttachments: () => void;
  onDeleteUpdateEntry: (entry: EnrichedRiskUpdateEntry) => Promise<void>;
}

export function RiskDetailContent({
  risk,
  attachments,
  mutate,
  mutateAttachments,
  onDeleteUpdateEntry,
}: RiskDetailContentProps) {
  const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<EnrichedRiskUpdateEntry | null>(
    null,
  );
  const [deleteEntry, setDeleteEntry] =
    useState<EnrichedRiskUpdateEntry | null>(null);

  const filteredSummary = risk.summary ?? "";
  const filteredMitigationPlan = risk.mitigation_plan ?? "";

  return (
    <>
      <AddUpdateModal
        open={isAddUpdateOpen || !!editEntry}
        onClose={() => {
          setIsAddUpdateOpen(false);
          setEditEntry(null);
        }}
        risk={risk}
        onSuccess={mutate}
        editEntry={editEntry ?? undefined}
      />

      {deleteEntry && (
        <DeleteActionDialog
          title="Delete update"
          description="Are you sure you want to delete this update? This action cannot be undone."
          onClose={() => setDeleteEntry(null)}
          onConfirm={() => onDeleteUpdateEntry(deleteEntry)}
        />
      )}

      <div>
        {/* Summary */}
        <section className="mb-5">
          {filteredSummary ? (
            <StaticTextEditor
              content={filteredSummary}
              editorClass="prose prose-sm w-full max-w-full text-ink-gray-7 leading-normal"
            />
          ) : (
            <p className="text-sm text-ink-gray-5">No summary provided.</p>
          )}
        </section>

        {/* Mitigation plan */}
        <section className="mb-4.5">
          <h3 className="mb-2 text-lg font-medium text-ink-gray-7">
            Mitigation plan
          </h3>
          {filteredMitigationPlan ? (
            <StaticTextEditor
              content={filteredMitigationPlan}
              editorClass="prose prose-sm w-full max-w-full text-ink-gray-7 leading-normal"
            />
          ) : (
            <p className="text-sm text-ink-gray-5">
              No mitigation plan provided.
            </p>
          )}
        </section>

        {/* Additional documents */}
        <section className="mb-4.5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-ink-gray-7">
              Additional documents
            </h3>
            <DocumentUploadButton
              riskName={risk.name}
              onSuccess={() => {
                mutate();
                mutateAttachments();
              }}
            />
          </div>

          {attachments.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {attachments.map((file) => (
                <FileCard key={file.name} file={file} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-gray-5">No documents attached.</p>
          )}
        </section>

        {/* Updates */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-ink-gray-7">Updates</h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddUpdateOpen(true)}
              aria-label="Add update"
              icon={() => <AddSm className="size-4" />}
            ></Button>
          </div>

          {risk.risk_update_log?.length > 0 ? (
            <div>
              {[...risk.risk_update_log].map((entry) => (
                <UpdateEntry
                  key={entry.name}
                  entry={entry}
                  onEdit={() => setEditEntry(entry)}
                  onDelete={() => setDeleteEntry(entry)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-gray-5">No updates yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
