type KnowledgePointProps = {
  title: string;
  value: string;
};

export function KnowledgePoint({ title, value }: KnowledgePointProps) {
  return (
    <div className="flex h-20 flex-1 min-w-0 flex-col justify-between rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <span className="truncate text-base font-normal text-ink-gray-5">
        {title}
      </span>
      <span className="truncate text-lg font-medium text-ink-gray-8">
        {value}
      </span>
    </div>
  );
}
