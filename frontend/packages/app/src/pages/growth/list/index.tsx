/**
 * External dependencies.
 */
import { useMemo } from "react";
import { Accordion } from "@base-ui/react/accordion";

/**
 * Internal dependencies.
 */
import { currencyFormat } from "@/lib/utils";
import { GrowthGroup } from "@/pages/project-details/tabs/growth/list/listViewGroup";
import type { GrowthInitiativeItem } from "@/pages/project-details/tabs/growth/types";
import {
  CLOSED_LIST_COLUMNS,
  NO_CLIENT_LABEL,
  OPEN_LIST_COLUMNS,
} from "../constants";
import { usePipeline } from "../context";
import type { PipelineInitiative, UsersByEmail } from "../types";

const CLOSED_GROUP = "__closed__";

const toListItem = (
  item: PipelineInitiative,
  users: UsersByEmail,
): GrowthInitiativeItem => ({
  ...item,
  billable_outcome: item.converted_outcome,
  owner_details: item.activity_owner ? users[item.activity_owner] : null,
  pm_details: item.project_manager ? users[item.project_manager] : null,
});

const sum = (items: GrowthInitiativeItem[]) =>
  items.reduce((total, item) => total + item.billable_outcome, 0);

export function PipelineList() {
  const initiatives = usePipeline((c) => c.state.initiatives);
  const clients = usePipeline((c) => c.state.clients);
  const users = usePipeline((c) => c.state.users);
  const currency = usePipeline((c) => c.state.currency);
  const closedOutcomes = usePipeline((c) => c.state.closedOutcomes);
  const format = currencyFormat(currency).format;

  const { groups, closed } = useMemo(() => {
    const byClient = new Map<string, GrowthInitiativeItem[]>();
    const closedItems: GrowthInitiativeItem[] = [];
    for (const item of initiatives) {
      const listItem = toListItem(item, users);
      if (item.is_closed) {
        closedItems.push(listItem);
        continue;
      }
      const key = item.customer ?? "";
      byClient.set(key, [...(byClient.get(key) ?? []), listItem]);
    }
    const clientGroups = [...byClient.entries()]
      .map(([key, items]) => ({
        key,
        label: key ? (clients[key]?.customer_name ?? key) : NO_CLIENT_LABEL,
        rate: key ? clients[key]?.hourly_rate : null,
        items,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return { groups: clientGroups, closed: closedItems };
  }, [initiatives, clients, users]);

  if (!initiatives.length) {
    return (
      <div className="py-10 text-center text-sm text-ink-gray-5">
        No growth initiatives found
      </div>
    );
  }

  const groupKeys = groups.map((group) => group.key || NO_CLIENT_LABEL);

  return (
    <div className="flex-1 overflow-auto px-5 pt-2 pb-10 scrollbar-thin">
      <Accordion.Root
        key={groupKeys.join("|")}
        multiple
        defaultValue={groupKeys}
      >
        {groups.map((group) => (
          <GrowthGroup
            key={group.key || NO_CLIENT_LABEL}
            value={group.key || NO_CLIENT_LABEL}
            label={group.label}
            columns={OPEN_LIST_COLUMNS}
            items={group.items}
            currency={currency}
            summary={
              <>
                {group.rate ? <span>{format(group.rate)}/hr</span> : null}
                <span>
                  Open value{" "}
                  <strong className="font-semibold text-ink-gray-8 tabular-nums">
                    {format(sum(group.items))}
                  </strong>
                </span>
              </>
            }
          />
        ))}
        {closed.length > 0 && (
          <GrowthGroup
            value={CLOSED_GROUP}
            label="Closed growth initiatives"
            columns={CLOSED_LIST_COLUMNS}
            items={closed}
            currency={currency}
            summary={closedOutcomes.map((outcome) => (
              <span key={outcome.name}>
                {outcome.name}{" "}
                {format(
                  sum(
                    closed.filter(
                      (item) => item.closed_status === outcome.name,
                    ),
                  ),
                )}
              </span>
            ))}
          />
        )}
      </Accordion.Root>
    </div>
  );
}
