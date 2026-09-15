/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  type FrappeError,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { TrackingLayout } from "./types";
import { parseStoredLayout } from "./utils";

const ENDPOINT = "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting";

type StoredView = {
  name: string;
  rows: unknown;
};

export function useTrackingLayout(projectId: string) {
  const toast = useToasts();
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, mutate } = useFrappeGetCall<{
    message: StoredView[];
  }>(`${ENDPOINT}.get_view`, { dt: "Project", project: projectId });

  const { call: createView } = useFrappePostCall(`${ENDPOINT}.create_view`);
  const { call: updateView } = useFrappePostCall(`${ENDPOINT}.update_view`);

  const storedView = data?.message?.[0];

  const storedLayout = useMemo(
    () => (storedView ? parseStoredLayout(storedView.rows) : null),
    [storedView],
  );

  const save = useCallback(
    async (layout: TrackingLayout) => {
      setIsSaving(true);
      try {
        if (storedView) {
          await updateView({ view: { name: storedView.name, rows: layout } });
        } else {
          await createView({
            view: {
              dt: "Project",
              type: "Tracking",
              project: projectId,
              label: `Tracking layout: ${projectId}`,
              public: 1,
              rows: layout,
            },
          });
        }
        await mutate();
        toast.success("Tracking layout updated");
        return true;
      } catch (error) {
        toast.error(parseFrappeErrorMsg(error as FrappeError));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [storedView, updateView, createView, mutate, projectId, toast],
  );

  return { storedLayout, isLoading, isSaving, save };
}
