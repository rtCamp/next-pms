/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { RiskDetailContent } from "./riskDetailContent";
import { RiskDetailHeader } from "./riskDetailHeader";
import { useRiskDetail } from "./useRiskDetail";

interface RiskDetailViewProps {
  riskId: string;
}

export function RiskDetailView({ riskId }: RiskDetailViewProps) {
  const { risk, attachments, followers, isLoading } = useRiskDetail(riskId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 h-full">
        <Spinner isFull={true} />
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="flex items-center justify-center flex-1 h-full text-sm text-ink-gray-5">
        Risk not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <RiskDetailHeader risk={risk} followers={followers} />
      <RiskDetailContent risk={risk} attachments={attachments} />
    </div>
  );
}
