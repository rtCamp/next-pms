/**
 * External dependencies.
 */
import { RefObject, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@next-pms/design-system/components";
import { KeyedMutator, mutate } from "swr";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";
import FieldRenderer from "./components/fieldRenderer";
import { FormContextProvider, useFormContext } from "./context";
import { Field, FieldConfigType } from "./types";

type FormViewProps = {
  docname: string;
  doctype: string;
  mutateData: KeyedMutator<any>;
  tabs: Record<string, Array<Field>>;
  readOnly?: boolean;
  currencySymbol?: string;
  tabHeaderClassName?: string;
  tabBodyClassName?: string;
  onChange?: (values: Record<string, string | number | null>) => void;
  onSubmit?: (values: Record<string, string | number | null>) => void;
  formRef: RefObject<{
    submitForm: () => void;
  }>;
  fieldConfig?: FieldConfigType;
};

/**
 * FormView Component
 * @description This component renders a tabbed form interface where each tab
 * contains different set of fields.
 * @param docname Docname of the fetched document
 * @param doctype Doctype of the fetched document
 * @param mutateData Function to refresh data
 * @param tabs Data containing Tabs and it's fields
 * @param readOnly Makes all fields readonly and form becomes un-submitabble
 * @param currencySymbol Currency symbol string to be used for displaying currencies
 * @param onChange Function to track form-field changes , returns form-data everytime a feild is changed
 * @param onSubmit Function to submit form changes , returns form-data
 * @returns A JSX Component
 */

const FormView = ({
  docname,
  doctype,
  mutateData,
  tabs,
  currencySymbol,
  onChange,
  onSubmit,
  tabHeaderClassName,
  tabBodyClassName,
  readOnly,
  formRef,
  fieldConfig,
}: FormViewProps) => {
  return (
    <>
      <FormContextProvider>
        <FormViewWrapper
          docname={docname}
          doctype={doctype}
          mutateData={mutateData}
          tabs={tabs}
          currencySymbol={currencySymbol}
          tabHeaderClassName={tabHeaderClassName}
          tabBodyClassName={tabBodyClassName}
          onChange={onChange}
          onSubmit={onSubmit}
          formRef={formRef}
          readOnly={readOnly}
          fieldConfig={fieldConfig}
        />
      </FormContextProvider>
    </>
  );
};

const FormViewWrapper = ({
  docname,
  doctype,
  mutateData,
  tabs,
  currencySymbol,
  onChange,
  onSubmit,
  tabHeaderClassName,
  tabBodyClassName,
  readOnly = false,
  formRef,
  fieldConfig = {},
}: FormViewProps) => {
  const [activeTab, setActiveTab] = useState(Object.keys(tabs ?? {})[0]);
  const { setDoctype, setDocname, setMutateData } = useFormContext();

  useEffect(() => {
    setDocname(docname);
    setDoctype(doctype);
    setMutateData(() => mutateData);
  }, [docname, doctype, mutateData]);

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative">
        <div className="border-b pt-1 sticky top-0 bg-background z-10 overflow-x-auto no-scrollbar px-2">
          <TabsList
            className={mergeClassNames(
              "flex h-10 w-full justify-start rounded-none bg-transparent p-0",
              tabHeaderClassName
            )}
          >
            {Object.keys(tabs ?? {})
              ?.map((item) => ({
                id: item,
                label: item,
              }))
              ?.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`relative h-10 rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground transition-none data-[state=active]:border-primary focus-visible:ring-0 data-[state=active]:text-foreground data-[state=active]:shadow-none`}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
          </TabsList>
        </div>

        {Object.keys(tabs ?? {})?.map((tab) => {
          return (
            <TabsContent key={tab} value={tab} className="space-y-4 focus-visible:ring-0">
              <FieldRenderer
                fields={tabs[tab]}
                readOnly={readOnly}
                onChange={onChange}
                onSubmit={onSubmit}
                currencySymbol={currencySymbol}
                fieldConfig={fieldConfig}
                ref={formRef}
                className={tabBodyClassName}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default FormView;
