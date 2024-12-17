import { Footer } from "@/app/layout/root";
import { LoadMore } from "@/app/components/loadMore";
import { Typography } from "@/app/components/typography";

interface FooterSectionProps {
  disabled: boolean;
  length: number;
  total_count: number;
  handleLoadMore: () => void;
}

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
