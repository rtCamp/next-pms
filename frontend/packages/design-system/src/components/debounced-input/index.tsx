/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
/**
 * Internal dependencies
 */
import { mergeClassNames, deBounce } from "../../utils";
import { default as Input, InputProps } from "../input";

export interface DeBounceInputProps extends InputProps {
  callback?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  deBounceValue?: number;
}
const DeBouncedInput = ({ value, className, callback, deBounceValue = 400, ...props }: DeBounceInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onInputChange = useCallback(
    deBounce((e: React.ChangeEvent<HTMLInputElement>) => {
      callback?.(e);
    }, deBounceValue),
    []
  );

  const handleEmployeeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      onInputChange(e);
    },
    [onInputChange]
  );
  const clearInput = () => {
    setInputValue("");
    onInputChange({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
  };

  useEffect(() => setInputValue(value), [value]);

  return (
    <div className={mergeClassNames("relative w-full min-w-60 max-w-60", className)}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
      </div>
      <Input
        className={mergeClassNames(
          " flex-1 w-full placeholder:text-slate-400  focus-visible:ring-slate-800 focus-visible:ring-offset-0 focus-visible:ring-0 py-2 pl-10 pr-10"
        )}
        placeholder="Search..."
        {...props}
        value={inputValue}
        onChange={handleEmployeeChange}
      />
      {inputValue && (
        <X
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-500 cursor-pointer"
          onClick={clearInput}
          aria-label="Clear search"
          role="button"
          tabIndex={0}
        />
      )}
    </div>
  );
};
export default DeBouncedInput;
