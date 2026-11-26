export const TOOLTIP_ARGS = {
  value: 42000,
  secondaryValue: 12000,
  markerValue: 70000,
  maxValue: 100000,
  primaryTooltip: "Cost accrued",
  secondaryTooltip: "Cost forecasted",
  markerTooltip: "Target cost",
};

export const RICH_TOOLTIP_TEMPLATE = `
  <div class="w-80 p-4">
    <BudgetBurnBar v-bind="args">
      <template #primary-tooltip>
        <div class="flex flex-col">
          <span class="font-semibold">Cost accrued</span>
          <span>₹40,000 of ₹1,00,000</span>
        </div>
      </template>
    </BudgetBurnBar>
  </div>
`;
