import { forwardRef } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserContext } from "@/app/provider/UserProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getCookie } from "@/app/lib/utils";
import { useContext } from "react";
import { RtCamp } from "../Icon";
import { Typography } from "../Typography";

export function Header() {
  const { alt, src } = get_user_avatar();
  const { logout } = useContext(UserContext);
  return (
    <div className="w-full ">
      <NavigationMenu
        viewPortClassName="w-full"
        className="max-w-full  w-full justify-start"
      >
        <div className="w-full">
          <NavigationMenuList className="justify-between">
            <NavigationMenuItem>
              <div className="flex gap-x-2 items-center">
                <RtCamp />
                <Typography variant="h5">Timesheet Entry</Typography>
              </div>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="h-[35px] w-[35px]  hover:cursor-pointer">
                    <AvatarImage src={decodeURIComponent(src)} alt={alt} />
                    <AvatarFallback>{alt}</AvatarFallback>
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent className="w-[200px]  mr-4">
                  <ul className=" w-full text-black text-left">
                    <ListItem
                      key="Switch to desk"
                      title="Switch to desk"
                      href="/desk"
                      className="relative"
                    ></ListItem>

                    <ListItem
                      key="Logout"
                      title="Logout"
                      href=""
                      onClick={logout}
                      className="relative"
                    ></ListItem>
                  </ul>
                </PopoverContent>
              </Popover>
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
            "flex select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none hover:bg-primary hover:text-primary-foreground",
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
