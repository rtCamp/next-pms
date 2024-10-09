import { MoveDown } from "lucide-react";
import { Button, ButtonProps } from "./ui/button";

export const LoadMore = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
  return (
    <Button className={className} variant={variant} size={size} asChild={asChild} {...props}>
      <MoveDown className="w-4 h-4" />
      Load More
    </Button>
  );
};
