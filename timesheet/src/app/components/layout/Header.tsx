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

export function Header() {
  const { alt, src } = get_user_avatar();
  const { logout } = useContext(UserContext);
  return (
    <div className=" border border-gray-300 rounded-r-md rounded-b-md p-2 ">
      <NavigationMenu viewPortClassName="left-auto right-0">
        <NavigationMenuList className="w-screen justify-between px-4">
          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className=" data-[state=open]:bg-transparent hover:bg-transparent">
              <Avatar>
                <AvatarImage src={decodeURIComponent(src)} alt={alt} />
                <AvatarFallback>{alt}</AvatarFallback>
              </Avatar>
            </NavigationMenuTrigger>
            <NavigationMenuContent className="right-0 left-auto">
              <ul className=" w-[200px] text-black text-left right-0 left-auto">
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
