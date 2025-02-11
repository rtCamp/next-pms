/**
 * External dependencies.
 */
import { useContext } from "react";
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
import { ArrowRightLeft, LogOut } from "lucide-react";
/**
 * Internal dependencies.
 */
import { DESK } from "@/lib/constant";
import { UserContext } from "@/lib/UserProvider";
import { cn } from "@/lib/utils";
import { RootState } from "@/store";

interface UserNavigationProps {
  user: RootState["user"];
  isMobile: boolean;
}

const UserNavigation = ({ user, isMobile }: UserNavigationProps) => {
  const { logout } = useContext(UserContext);
  return (
    <ErrorFallback>
      <Popover>
        <PopoverTrigger title={user.userName} className={cn("flex items-center gap-x-2 truncate")}>
          <Avatar className="w-8 h-8 justify-self-end transition-all duration-600">
            <AvatarImage src={decodeURIComponent(user.image)} />
            <AvatarFallback>{user.userName[0]}</AvatarFallback>
          </Avatar>
          <Typography
            variant="p"
            className={cn(
              "transition-all duration-800 max-md:hidden overflow-hidden max-w-full max-lg:1/3 truncate",
              isMobile && "hidden"
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
            <ArrowRightLeft className="w-4 h-4" />
            Switch To Desk
          </a>
          <Separator className="my-1" />
          <Button
            variant="link"
            className="flex justify-start hover:no-underline font-normal hover:bg-accent p-2 gap-x-2 items-center focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </PopoverContent>
      </Popover>
    </ErrorFallback>
  );
};

export default UserNavigation;
