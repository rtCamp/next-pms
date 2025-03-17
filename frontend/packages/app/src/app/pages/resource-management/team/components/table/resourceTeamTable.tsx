/**
 * External dependencies.
 */
import { useContext } from "react";
import { Table } from "@next-pms/design-system/components";
import { ResourceTableHeader as ResourceTeamTableHeader } from "@next-pms/resource-management/components";
import { TableContextProvider } from "@next-pms/resource-management/store";
import { InfiniteScroll } from "@/app/components/infiniteScroll";

/**
 * Internal dependencies.
 */
import { ResourceTeamTableBody } from "./resourceTeamTableBody";
import { EmptyTableBody } from "../../../components/empty";
import { TeamContext } from "../../../store/teamContext";
import type { AllocationDataProps, DateProps } from "../../../store/types";

/**
 * This component is responsible for loading the table for table view.
 *
 * @param props.onSubmit The on submit function used to handle soft update of allocation data.
 * @returns React.FC
 */
const ResourceTeamTable = ({
  onSubmit,
  cellHeaderRef,
  dateToAddHeaderRef,
  handleVerticalLoadMore,
}: {
  onSubmit: (oldData: AllocationDataProps, data: AllocationDataProps) => void;
  cellHeaderRef: React.LegacyRef<HTMLTableCellElement>;
  dateToAddHeaderRef: string;
  handleVerticalLoadMore: () => void;
}) => {
  const { teamData, apiController, getHasMore } = useContext(TeamContext);

  const dates: DateProps[] = teamData.dates;
  const isLoading = apiController.isLoading;
  const hasMore = getHasMore();

  if (dates.length == 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <EmptyTableBody />
      </div>
    );
  }

  return (
    <TableContextProvider>
      <Table className="relative">
        <ResourceTeamTableHeader
          dateToAddHeaderRef={dateToAddHeaderRef}
          cellHeaderRef={cellHeaderRef}
          dates={dates}
          title="Members"
        />
        <InfiniteScroll isLoading={isLoading} hasMore={hasMore} verticalLodMore={handleVerticalLoadMore}>
          <ResourceTeamTableBody onSubmit={onSubmit} />
        </InfiniteScroll>
      </Table>
    </TableContextProvider>
  );
};

export { ResourceTeamTable };
