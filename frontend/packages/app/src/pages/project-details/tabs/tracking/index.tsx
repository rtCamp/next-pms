/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";
import { DeleteActionDialog } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";
import { useUser } from "@/providers/user";
import { AddWidgetModal } from "./components/addWidgetModal";
import { TrackingHeader } from "./components/trackingHeader";
import { TrackingSkeleton } from "./components/trackingSkeleton";
import { WidgetShell } from "./components/widgetShell";
import {
  CUSTOMIZABLE_WIDGETS,
  CUSTOMIZATION_ROLES,
  ROW_COLUMNS,
  getDefaultLayout,
} from "./constants";
import { useTracking } from "./context";
import { TrackingProvider } from "./provider";
import type { WidgetKey } from "./types";
import { useTrackingLayout } from "./useTrackingLayout";
import { applyHiddenWidgets, getHiddenWidgets } from "./utils";
import { WIDGETS } from "./widgetRegistry";
import { useProjectDetail } from "../../context";

function TrackingContent() {
  const projectId = useProjectDetail((state) => state.projectId);
  const isLoading = useTracking((state) => state.isLoading);
  const billingType = useTracking((state) => state.tracking.billing_type);
  const roles = useUser(({ state }) => state.roles);

  const {
    storedLayout,
    isLoading: isLayoutLoading,
    isSaving,
    save: saveLayout,
  } = useTrackingLayout(projectId);

  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{
    key: WidgetKey;
    label: string;
  } | null>(null);

  const defaultLayout = useMemo(
    () => getDefaultLayout(billingType),
    [billingType],
  );

  const hidden = useMemo(
    () => (storedLayout ? getHiddenWidgets(defaultLayout, storedLayout) : []),
    [defaultLayout, storedLayout],
  );

  const layout = useMemo(
    () => applyHiddenWidgets(defaultLayout, hidden),
    [defaultLayout, hidden],
  );

  const confirmRemoval = useCallback(
    async (key: WidgetKey) => {
      await saveLayout(applyHiddenWidgets(defaultLayout, [...hidden, key]));
    },
    [saveLayout, defaultLayout, hidden],
  );

  const saveFromModal = useCallback(
    async (next: WidgetKey[]) => {
      const saved = await saveLayout(applyHiddenWidgets(defaultLayout, next));
      if (saved) {
        setIsModalOpen(false);
      }
    },
    [saveLayout, defaultLayout],
  );

  if (isLoading || isLayoutLoading) {
    return <TrackingSkeleton />;
  }

  const canCustomize = CUSTOMIZATION_ROLES.some((role) => roles.includes(role));

  return (
    <div className="flex flex-col gap-6">
      <TrackingHeader
        canCustomize={canCustomize}
        isEditing={isEditing}
        isSaving={isSaving}
        onToggleEdit={() => setIsEditing((editing) => !editing)}
        onAddWidgets={() => setIsModalOpen(true)}
      />

      {layout.map((row) => {
        const widgetLayout = row.length === 1 ? "row" : "stacked";

        return (
          <div
            key={row.join("|")}
            className={cn("grid gap-3", ROW_COLUMNS[row.length])}
          >
            {row.map((key) => {
              const Widget = WIDGETS[key];
              const customizable = CUSTOMIZABLE_WIDGETS.find(
                (widget) => widget.key === key,
              );

              if (isEditing && customizable) {
                return (
                  <WidgetShell
                    key={key}
                    label={customizable.label}
                    onRemove={() => setPendingRemoval(customizable)}
                  >
                    <Widget layout={widgetLayout} />
                  </WidgetShell>
                );
              }

              return <Widget key={key} layout={widgetLayout} />;
            })}
          </div>
        );
      })}

      <AddWidgetModal
        open={isModalOpen}
        hidden={hidden}
        isSaving={isSaving}
        onClose={() => setIsModalOpen(false)}
        onSave={saveFromModal}
      />

      {pendingRemoval && (
        <DeleteActionDialog
          title="Remove widget"
          description={`Remove "${pendingRemoval.label}" from this project's tracking page? Everyone on the project sees this change.`}
          confirmLabel="Remove"
          onClose={() => setPendingRemoval(null)}
          onConfirm={() => confirmRemoval(pendingRemoval.key)}
        />
      )}
    </div>
  );
}

export function Tracking() {
  return (
    <TrackingProvider>
      <TrackingContent />
    </TrackingProvider>
  );
}
