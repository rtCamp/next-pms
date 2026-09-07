/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";

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

  const [stagedHidden, setStagedHidden] = useState<WidgetKey[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultLayout = useMemo(
    () => getDefaultLayout(billingType),
    [billingType],
  );

  const hidden = useMemo(
    () => (storedLayout ? getHiddenWidgets(defaultLayout, storedLayout) : []),
    [defaultLayout, storedLayout],
  );

  const layout = useMemo(
    () => applyHiddenWidgets(defaultLayout, stagedHidden ?? hidden),
    [defaultLayout, stagedHidden, hidden],
  );

  const startEditing = useCallback(() => setStagedHidden(hidden), [hidden]);

  const cancelEditing = useCallback(() => {
    setStagedHidden(null);
    setIsModalOpen(false);
  }, []);

  const save = useCallback(async () => {
    const saved = await saveLayout(
      applyHiddenWidgets(defaultLayout, stagedHidden ?? []),
    );
    if (saved) {
      setStagedHidden(null);
      setIsModalOpen(false);
    }
  }, [saveLayout, defaultLayout, stagedHidden]);

  const addWidget = useCallback((key: WidgetKey) => {
    setStagedHidden((current) => (current ?? []).filter((it) => it !== key));
  }, []);

  const removeWidget = useCallback((key: WidgetKey) => {
    setStagedHidden((current) =>
      current?.includes(key) ? current : [...(current ?? []), key],
    );
  }, []);

  if (isLoading || isLayoutLoading) {
    return <TrackingSkeleton />;
  }

  const canCustomize = CUSTOMIZATION_ROLES.some((role) => roles.includes(role));
  const isEditing = stagedHidden !== null;
  const isDirty =
    stagedHidden !== null &&
    (stagedHidden.length !== hidden.length ||
      stagedHidden.some((key) => !hidden.includes(key)));

  return (
    <div className="flex flex-col gap-6">
      <TrackingHeader
        canCustomize={canCustomize}
        isEditing={isEditing}
        isDirty={isDirty}
        isSaving={isSaving}
        onEdit={startEditing}
        onCancel={cancelEditing}
        onSave={() => void save()}
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
                    onRemove={() => removeWidget(key)}
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
        onOpenChange={setIsModalOpen}
        hidden={stagedHidden ?? []}
        onAdd={addWidget}
        onRemove={removeWidget}
      />
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
