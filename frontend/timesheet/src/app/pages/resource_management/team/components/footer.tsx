import { Footer } from "@/app/layout/root";
import { LoadMore } from "@/app/components/loadMore";
import { setStart } from "@/store/resource_management/team";
import { Typography } from "@/app/components/typography";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";

interface FooterSectionProps {
  isLoading: boolean;
  isValidating: boolean;
}

const FooterSection = ({ isLoading, isValidating }: FooterSectionProps) => {
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const dispatch = useDispatch();

  const handleLoadMore = () => {
    if (!resourceTeamState.hasMore) return;
    dispatch(setStart(resourceTeamState.start + resourceTeamState.pageLength));
  };

  return (
    <Footer>
      <div className="flex justify-between items-center">
        <LoadMore
          variant="outline"
          onClick={handleLoadMore}
          disabled={
            !resourceTeamState.hasMore ||
            ((isLoading || isValidating) && Object.keys(resourceTeamState.data.data).length != 0)
          }
        />
        <Typography variant="p" className="lg:px-5 font-semibold">
          {`${Object.keys(resourceTeamState.data.data).length | 0} of ${resourceTeamState.data.total_count | 0}`}
        </Typography>
      </div>
    </Footer>
  );
};

export { FooterSection };
