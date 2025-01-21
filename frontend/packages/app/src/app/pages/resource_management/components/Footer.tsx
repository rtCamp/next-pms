/**
 * External dependencies
 */
import { Typography } from "@next-pms/design-system/components";
/**
 * Internal dependencies.
 */
import { LoadMore } from "@/app/components/loadMore";
import { Footer } from "@/app/layout/root";

interface FooterSectionProps {
  disabled: boolean;
  length: number;
  total_count: number;
  handleLoadMore: () => void;
}

/**
 * This component is responsible for rendering the footer section of the resource management tables.
 * 
 * @param props.disabled whether the load more button is disabled or not.
 * @param props.length current length of the data.
 * @param props.total_count the total count of the data.
 * @param props.handleLoadMore the function to handle the load more button.
 * @returns React.FC
 */
const FooterSection = ({ disabled, handleLoadMore, length, total_count }: FooterSectionProps) => {
  return (
    <Footer>
      <div className="flex justify-between items-center">
        <LoadMore variant="outline" onClick={handleLoadMore} disabled={disabled} />
        <Typography variant="p" className="lg:px-5 font-semibold">
          {`${length | 0} of ${total_count | 0}`}
        </Typography>
      </div>
    </Footer>
  );
};

export { FooterSection };
