/**
 * External dependencies.
 */
import {
  ErrorFallback,
  Typography,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@next-pms/design-system/components";
import { ArrowRightLeft, LogOut, Sun, Moon } from "lucide-react";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { DESK } from "@/lib/constant";
import { UserContext } from "@/lib/UserProvider";
import { mergeClassNames } from "@/lib/utils";
import { useTheme } from "@/providers/theme/hook";
import type { UserNavigationProps } from "./types";

const UserNavigation = ({ user }: UserNavigationProps) => {
  const logout = useContextSelector(UserContext, (value) => value.actions.logout);
  const { theme, isDarkThemeOnSystem, setTheme } = useTheme();

  const changeTheme = () => {
    if (theme === "system") {
      setTheme(isDarkThemeOnSystem ? "light" : "dark");
    } else {
      setTheme(theme === "light" ? "dark" : "light");
    }
  };
  return (
    <ErrorFallback>
      <Popover>
        <PopoverTrigger title={user.userName} className={mergeClassNames("flex items-center gap-x-2 truncate")}>
          <Avatar className="w-8 h-8 justify-self-end transition-all duration-600">
            <AvatarImage src={decodeURIComponent(user.image)} />
            <AvatarFallback>{user.userName[0]}</AvatarFallback>
          </Avatar>
          <Typography
            variant="p"
            className={mergeClassNames(
              "transition-all duration-800 max-md:hidden overflow-hidden max-w-full max-lg:1/3 truncate",
              user.isSidebarCollapsed && "hidden"
            )}
          >
            {user.userName}
          </Typography>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col p-1 w-52 z-[1000]">
          <a
            className="flex justify-start text-sm hover:no-underline hover:bg-accent p-2 gap-x-2 items-center"
            href={DESK}
          >
            <ArrowRightLeft />
            Switch To Desk
          </a>
          <Separator className="my-1" />
          <Button
            variant="link"
            className="flex justify-start hover:no-underline font-normal hover:bg-accent p-2 gap-x-2 items-center focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={changeTheme}
          >
            {theme === "system" ? (
              <>{isDarkThemeOnSystem ? <Sun /> : <Moon />}</>
            ) : (
              <>{theme === "light" ? <Moon /> : <Sun />}</>
            )}
            Toggle theme
          </Button>
          <Separator className="my-1" />
          <Button
            variant="link"
            className="flex justify-start hover:no-underline font-normal hover:bg-accent p-2 gap-x-2 items-center focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={logout}
          >
            <LogOut />
            Logout
          </Button>
        </PopoverContent>
      </Popover>
    </ErrorFallback>
  );
};

export default UserNavigation;
