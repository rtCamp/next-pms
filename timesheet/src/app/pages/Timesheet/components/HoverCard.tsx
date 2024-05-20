import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
export function TimesheetHoverCard({ tooltip }: { tooltip: any }) {
  return (
    <HoverCard open={tooltip.visible && tooltip.content}>
      <HoverCardTrigger></HoverCardTrigger>
      <HoverCardContent
        className="absolute translate-x-0 translate-y-0"
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        {tooltip.content}
      </HoverCardContent>
    </HoverCard>
  );
}
