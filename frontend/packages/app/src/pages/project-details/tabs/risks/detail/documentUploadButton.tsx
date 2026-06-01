/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";
import { Button, FileUploader, useToasts } from "@rtcamp/frappe-ui-react";
import { Plus } from "lucide-react";

interface DocumentUploadButtonProps {
  riskName: string;
  onSuccess: () => void;
}

export function DocumentUploadButton({
  riskName,
  onSuccess,
}: DocumentUploadButtonProps) {
  const toast = useToasts();

  return (
    <FileUploader
      uploadArgs={{ doctype: "Risk", docname: riskName }}
      onSuccess={onSuccess}
      onFailure={(err) => {
        let message = "Failed to upload document.";
        if (
          err &&
          typeof err === "object" &&
          err !== null &&
          "_server_messages" in err
        ) {
          try {
            message = JSON.parse(
              JSON.parse(
                (err as { _server_messages: string })._server_messages,
              )[0],
            ).message;
          } catch {
            // ignore
          }
        } else if (
          err &&
          typeof err === "object" &&
          err !== null &&
          "exc" in err
        ) {
          try {
            message = JSON.parse((err as { exc: string }).exc)[0]
              .split("\n")
              .slice(-2, -1)[0];
          } catch {
            // ignore
          }
        }
        toast.error(message);
      }}
    >
      {({ uploading, openFileSelector }) => (
        <Button
          type="button"
          variant="ghost"
          onClick={openFileSelector}
          disabled={uploading}
          aria-label="Add document"
        >
          {uploading ? (
            <Spinner className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
        </Button>
      )}
    </FileUploader>
  );
}
