/**
 * External dependencies
 */
import { ComboBox, Badge } from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Filter } from "lucide-react";
/**
 * Internal dependencies
 */
import type { FilterPops, ApiCallProps } from "@/app/components/list-view/types";
import { mergeClassNames } from "@/lib/utils";

/**
 * A Wrapper around ComboxBox to handle the data fetching part dynamically.
 *
 * @param props.filter The filter to be displayed in the header section.
 * @param props.handleChangeWrapper The handle change wrapper function.
 * @returns React.FC
 */
const ComboBoxWrapper = ({
  filter,
  handleChangeWrapper,
}: {
  filter: FilterPops;
  handleChangeWrapper: (value: string | string[]) => void;
}) => {
  const apiCall: ApiCallProps | undefined = filter.apiCall;

  const { data, mutate } = useFrappeGetCall(
    apiCall?.url as string,
    apiCall?.filters,
    undefined,
    apiCall?.options ? { revalidateOnMount: false, ...apiCall.options } : { revalidateOnMount: false }
  );

  const handleOnClick = () => {
    if (!data) {
      mutate();
    }
  };

  return (
    <ComboBox
      value={filter.value as string[]}
      label={filter.label as string}
      isMulti={filter?.isMultiComboBox ?? false}
      shouldFilter={filter?.shouldFilterComboBox ?? false}
      showSelected={false}
      onSelect={handleChangeWrapper}
      onSearch={filter.onComboSearch}
      onClick={handleOnClick}
      rightIcon={
        filter?.isMultiComboBox
          ? ((filter.value as string[])?.length ?? 0) > 0 && (
              <Badge className="p-0 justify-center w-5 h-5">{(filter.value as string[]).length}</Badge>
            )
          : (filter.value?.toString()?.length ?? 0) > 0 && <Badge className="p-0 justify-center w-5 h-5">1</Badge>
      }
      leftIcon={
        <Filter
          className={mergeClassNames(
            "h-4 w-4",
            filter?.isMultiComboBox
              ? (filter.value as string[])?.length != 0 && "fill-primary"
              : (filter.value?.toString()?.length ?? 0) > 0 && "fill-primary"
          )}
        />
      }
      data={
        data?.message?.map((d: { name: string; label: string }) => ({
          label: d.label ? d.label : d.name,
          value: d.name,
        })) ?? []
      }
      className="text-primary border-dashed gap-x-2 font-normal w-fit z-100"
    />
  );
};

export default ComboBoxWrapper;
