import { Input, InputProps } from "@/app/components/ui/input";
import { cn, deBounce } from "@/lib/utils";
import { useCallback, useState } from "react";

export interface DeBounceInputProps extends InputProps {
  callback?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  deBounceValue?: number;
}
export const DeBounceInput = ({ value, className, callback, deBounceValue = 500, ...props }: DeBounceInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onInputChange = useCallback(
    deBounce((e: React.ChangeEvent<HTMLInputElement>) => {
      callback && callback(e);
    }, deBounceValue),
    [],
  );

  const handleEmployeeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      onInputChange(e);
    },
    [onInputChange],
  );
  return (
    <Input
      className={cn("placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-800 max-w-sm", className)}
      {...props}
      value={inputValue}
      onChange={handleEmployeeChange}
    />
  );
};
