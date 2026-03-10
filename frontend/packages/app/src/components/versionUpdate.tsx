/**
 * External dependencies.
 */
import { ReactNode } from "react";
import { Button } from "@next-pms/design-system/components";
import { useToast } from "@next-pms/design-system/hooks";
import { useFrappeVersionUpdate } from "@next-pms/hooks";

export const VersionUpdate = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  useFrappeVersionUpdate(() => {
    toast({
      title: "New version available",
      description: "Please refresh the page to get the latest version.",
      action: <Button onClick={() => window.location.reload()}>Refresh</Button>,
      duration: 10000,
    });
  });
  return <>{children}</>;
};
