import * as React from "react"
import { useContext, useRef } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"

import { cn } from "@/lib/utils"


import { UserContext } from "@/provider/UserProvider";

function Timesheet() {
  const { currentUser, isLoading } = useContext(UserContext);

  return (
    <div className="mt-10 border-l border-t border-r border-gray-300 rounded-tl-lg rounded-tr-lg p-2 min-w-[1300px]">
      <div className="fixed top-0 pt-2 border-l border-b border-r border-gray-300 rounded-bl-lg rounded-br-lg min-w-[1280px]">
      <NavigationMenu>
      <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>{currentUser}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] text-black text-left">
                  <ListItem
                    key="Switch to desk"
                    title="Switch to desk"
                    href="/desk"
                  >
                  </ListItem>
                  <ListItem
                    key="Logout"
                    title="Logout"
                    href="/?cmd=web_logout"
                  >
                  </ListItem>
            </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      </div>
    </div>
  );
}

export default Timesheet;


const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none hover:bg-accent hover:text-accent-foreground text-black focus:bg-accent",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"