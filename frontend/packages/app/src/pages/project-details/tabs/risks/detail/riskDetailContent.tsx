/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { stripTags } from "@/lib/utils";
import type { RiskDetail, FileAttachment } from "../types";
import { FileCard } from "./fileCard";
import { UpdateEntry } from "./updateEntry";

interface RiskDetailContentProps {
  risk: RiskDetail;
  attachments: FileAttachment[];
}

export function RiskDetailContent({
  risk,
  attachments,
}: RiskDetailContentProps) {
  return (
    <div>
      {/* Summary */}
      {risk.summary && (
        <section className="mb-6">
          <p className="text-base leading-relaxed text-ink-gray-8">
            {stripTags(risk.summary)}
          </p>
        </section>
      )}

      {/* Mitigation plan */}
      {risk.mitigation_plan && (
        <section className="mb-6">
          <h3 className="mb-2 text-lg font-medium text-ink-gray-8">
            Mitigation plan
          </h3>
          <p className="text-base leading-relaxed text-ink-gray-8">
            {stripTags(risk.mitigation_plan)}
          </p>
        </section>
      )}

      {/* Additional documents */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-ink-gray-8">
            Additional documents
          </h3>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {}}
            aria-label="Add document"
            icon={() => <Plus />}
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
            onClick={() => {}}
            aria-label="Add update"
            icon={() => <Plus />}
          />
        </div>

        {risk.risk_update_log?.length > 0 ? (
          <div>
            {[...risk.risk_update_log].map((entry) => (
              <UpdateEntry key={entry.name} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-gray-5">No updates yet.</p>
        )}
      </section>
    </div>
  );
}
