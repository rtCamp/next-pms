/**
 * External dependencies.
 */
import { useSearchParams } from "react-router";
import { Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { GROWTH_DETAIL_PARAM } from "@/pages/project-details/tabs/growth/constants";
import { GrowthDetailView } from "@/pages/project-details/tabs/growth/detail";
import { GrowthDialogs } from "@/pages/project-details/tabs/growth/dialogs";
import { PipelineBoard } from "./board";
import { usePipeline } from "./context";
import { PipelineHeader } from "./header";
import { PipelineList } from "./list";
import { MoveDialog } from "./moveDialog";
import { GrowthPipelineProvider } from "./provider";
import { PipelineSummary } from "./summary";
import { PipelineToolbar } from "./toolbar";

function PipelineContent() {
  const [searchParams] = useSearchParams();
  const growthId = searchParams.get(GROWTH_DETAIL_PARAM);
  const view = usePipeline((c) => c.state.view);
  const isLoading = usePipeline((c) => c.state.isLoading);
  const pendingMove = usePipeline((c) => c.state.pendingMove);

  if (growthId) {
    return (
      <div className="flex h-full flex-col overflow-auto p-5">
        <GrowthDialogs />
        <GrowthDetailView growthId={growthId} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <GrowthDialogs />
      {pendingMove && <MoveDialog move={pendingMove} />}
      <PipelineHeader />
      <PipelineToolbar />
      <PipelineSummary />
      {isLoading ? (
        <Spinner isFull />
      ) : view === "list" ? (
        <PipelineList />
      ) : (
        <PipelineBoard />
      )}
    </div>
  );
}

export default function GrowthPipeline() {
  return (
    <GrowthPipelineProvider>
      <PipelineContent />
    </GrowthPipelineProvider>
  );
}
