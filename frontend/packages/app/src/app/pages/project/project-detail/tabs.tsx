/**
 * External dependencies.
 */
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
type ProjectTabsProps = {
  tabs: Array<string>;
};
const ProjectTabs = ({ tabs }: ProjectTabsProps) => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="w-full py-2">
      <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b overflow-x-auto no-scrollbar">
          <TabsList className="flex h-10 w-full justify-start rounded-none bg-transparent p-0">
            {tabs
              .map((item) => ({
                id: item,
                label: item,
              }))
              .map((tab) => (
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

        {tabs.map((tab) => {
          return (
            <TabsContent value={tab} className="mt-6 space-y-4">
              <div className="rounded-lg "></div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default ProjectTabs;
