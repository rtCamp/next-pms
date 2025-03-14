/**
 * External dependencies.
 */
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import FieldRenderer from "./fieldRenderer";

type FormViewProps = {
  tabs: Record<string, Array<Record<string, string | number | null>>>;
};

/**
 * FormView Component
 * @description This component renders a tabbed form interface where each tab
 * contains different set of fields.
 * @param tabs Data containing Tabs and it's fields
 * @returns A JSX Component
 */

const FormView = ({ tabs }: FormViewProps) => {
  const [activeTab, setActiveTab] = useState(Object.keys(tabs ?? {})[0]);

  return (
    <div className="w-full py-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b overflow-x-auto no-scrollbar">
          <TabsList className="flex h-10 w-full justify-start rounded-none bg-transparent p-0">
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
            <TabsContent key={tab} value={tab} className="mt-6 space-y-4">
              <div className="rounded-lg px-4">
                <FieldRenderer tabName={tab} fields={tabs[tab]} />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default FormView;
