import { mergeClassNames } from "@next-pms/design-system";

interface HeaderProps {
  children: React.ReactNode;
  className?: string;
  parentClassName?: string;
}

export const Header = ({
  children,
  className,
  parentClassName,
}: HeaderProps) => {
  return (
    <div
      className={mergeClassNames(
        "flex border-b border-outline-gray-1",
        parentClassName,
      )}
    >
      <header
        className={mergeClassNames(
          "flex flex-wrap gap-2 h-14 max-md:h-fit items-center justify-between px-3 py-2 w-full",
          className,
        )}
      >
        {children}
      </header>
    </div>
  );
};
