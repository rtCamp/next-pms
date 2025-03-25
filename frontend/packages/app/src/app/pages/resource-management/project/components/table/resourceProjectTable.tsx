/**
 * External dependencies.
 */
import { Table } from "@next-pms/design-system/components";
import { useInfiniteScroll } from "@next-pms/hooks";
import { ResourceTableHeader as ResourceProjectTableHeader } from "@next-pms/resource-management/components";
import { TableContextProvider } from "@next-pms/resource-management/store";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/app/components/infiniteScroll";
import { ResourceProjectTableBody } from "./resourceProjectTableBody";
import { EmptyTableBody } from "../../../components/empty";
import { ProjectContext } from "../../../store/projectContext";
import type { AllocationDataProps, DateProps } from "../../../store/types";

/**
 * This component is responsible for loading the table for project view.
 *
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @param props.dateToAddHeaderRef The date to add header ref.
 * @returns React.FC
 */
const ResourceProjectTable = ({
  onSubmit,
  dateToAddHeaderRef,
}: {
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
  dateToAddHeaderRef: string;
}) => {
  const { projectData, filters, apiController } = useContextSelector(ProjectContext, (value) => value.state);

  const { getHasMore, setMaxWeek, setStart } = useContextSelector(ProjectContext, (value) => value.actions);

  const dates: DateProps[] = projectData.dates;
  const isLoading = apiController.isLoading;
  const maxWeek = filters.maxWeek;
  const hasMore = getHasMore();
  const start = filters.start;
  const pageLength = filters.pageLength;

  const handleLoadMore = () => {
    if (isLoading) return;
    setMaxWeek(maxWeek + 3);
  };

  const cellHeaderRef = useInfiniteScroll({ isLoading: isLoading, hasMore: true, next: () => handleLoadMore() });

  const handleVerticalLoadMore = () => {
    if (!hasMore) return;
    setStart(start + pageLength);
  };

  if (dates.length == 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <EmptyTableBody />
      </div>
    );
  }

  return (
    <TableContextProvider>
      <Table className="w-screen">
        <ResourceProjectTableHeader
          dates={dates}
          title="Projects"
          cellHeaderRef={cellHeaderRef}
          dateToAddHeaderRef={dateToAddHeaderRef}
        />
        <InfiniteScroll isLoading={isLoading ? true : false} hasMore={hasMore} verticalLodMore={handleVerticalLoadMore}>
          <ResourceProjectTableBody onSubmit={onSubmit} />
        </InfiniteScroll>
      </Table>
    </TableContextProvider>
  );
};

export { ResourceProjectTable };
