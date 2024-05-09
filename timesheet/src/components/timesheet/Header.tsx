import * as React from "react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getCookie } from "@/lib/utils";

export function Header() {
  const { alt, src } = get_user_avatar();
  return (
    <div className=" border border-gray-300 rounded-r-md rounded-b-md p-2 ">
      <NavigationMenu>
        <NavigationMenuList className="w-screen justify-between px-4">
          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="hover:border-none data-[state=open]:bg-transparent hover:bg-transparent">
              <Avatar>
                <AvatarImage src={decodeURIComponent(src)} alt={alt} />
                <AvatarFallback>{alt}</AvatarFallback>
              </Avatar>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] text-black text-left">
                <ListItem
                  key="Switch to desk"
                  title="Switch to desk"
                  href="/desk"
                  className="relative"
                ></ListItem>

                <ListItem
                  key="Logout"
                  title="Logout"
                  href="/?cmd=web_logout"
                  className="relative"
                ></ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

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
            "flex select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none hover:bg-accent hover:text-accent-foreground text-black focus:bg-accent",
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
  );
});
ListItem.displayName = "ListItem";

function get_user_avatar() {
  const userImage = getCookie("user_image");
  const fullName = getCookie("full_name");

  return {
    alt: fullName?.charAt(0) ?? "",
    src: userImage ?? "",
  };
}
