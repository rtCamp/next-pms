import { forwardRef } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { UserContext } from "@/app/provider/UserProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getCookie } from "@/app/lib/utils";
import { useContext } from "react";
import { Icon } from "../Icon";

export function Header() {
  const { alt, src } = get_user_avatar();
  const { logout } = useContext(UserContext);
  return (
    <div className="">
      <NavigationMenu
        viewPortClassName="w-full"
        className="max-w-full  w-full justify-start"
      >
        <div className="w-full">
          <NavigationMenuList className="justify-between">
            <NavigationMenuItem>
              <div className="flex gap-x-2 items-center">
                <Icon name="rtCamp" />
                <p className="text-[18px] leading-7 font-bold">Timesheet Entry</p>
              </div>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger className=" p-0 data-[state=open]:bg-transparent hover:bg-transparent">
                <Avatar className="h-[35px] w-[35px]">
                  <AvatarImage src={decodeURIComponent(src)} alt={alt} />
                  <AvatarFallback>{alt}</AvatarFallback>
                </Avatar>
              </NavigationMenuTrigger>
              <NavigationMenuContent className="right-0 left-auto ">
                <ul className=" w-[200px] text-black text-left right-0 ">
                  <ListItem
                    key="Switch to desk"
                    title="Switch to desk"
                    href="/desk"
                    className="relative"
                  ></ListItem>

                  <ListItem
                    key="Logout"
                    title="Logout"
                    onClick={logout}
                    className="relative hover:cursor-pointer"
                  ></ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </div>
      </NavigationMenu>
    </div>
  );
}

const ListItem = forwardRef<
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
