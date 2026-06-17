/**
 * External dependencies.
 */
import { useState } from "react";
import { stripTags } from "@next-pms/design-system/utils";
import { Button } from "@rtcamp/frappe-ui-react";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { AddUpdateModal } from "../add-update";
import type {
  EnrichedRiskUpdateEntry,
  RiskDetail,
  FileAttachment,
} from "../types";
import { DeleteUpdateEntryDialog } from "./deleteUpdateEntryDialog";
import { DocumentUploadButton } from "./documentUploadButton";
import { FileCard } from "./fileCard";
import { UpdateEntry } from "./updateEntry";

interface RiskDetailContentProps {
  risk: RiskDetail;
  attachments: FileAttachment[];
  mutate: () => void;
  mutateAttachments: () => void;
}

export function RiskDetailContent({
  risk,
  attachments,
  mutate,
  mutateAttachments,
}: RiskDetailContentProps) {
  const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<EnrichedRiskUpdateEntry | null>(
    null,
  );
  const [deleteEntry, setDeleteEntry] =
    useState<EnrichedRiskUpdateEntry | null>(null);

  const filteredSummary = risk.summary ? stripTags(risk.summary) : "";
  const filteredMitigationPlan = risk.mitigation_plan
    ? stripTags(risk.mitigation_plan)
    : "";

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
        <DeleteUpdateEntryDialog
          entry={deleteEntry}
          risk={risk}
          onClose={() => setDeleteEntry(null)}
          onSuccess={mutate}
        />
      )}

      <div>
        {/* Summary */}
        <section className="mb-6">
          {filteredSummary ? (
            <p className="text-base leading-relaxed text-ink-gray-8">
              {filteredSummary}
            </p>
          ) : (
            <p className="text-sm text-ink-gray-5">No summary provided.</p>
          )}
        </section>

        {/* Mitigation plan */}
        <section className="mb-6">
          <h3 className="mb-2 text-lg font-medium text-ink-gray-8">
            Mitigation plan
          </h3>
          {filteredMitigationPlan ? (
            <p className="text-base leading-relaxed text-ink-gray-8">
              {filteredMitigationPlan}
            </p>
          ) : (
            <p className="text-sm text-ink-gray-5">
              No mitigation plan provided.
            </p>
          )}
        </section>

        {/* Additional documents */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-ink-gray-8">
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
            <h3 className="text-lg font-medium text-ink-gray-8">Updates</h3>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddUpdateOpen(true)}
              aria-label="Add update"
              icon={() => <Plus className="size-4" />}
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
