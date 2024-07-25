import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Bell, LogOut, ArrowRightLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { DESK } from "@/lib/constant";
import { useContext } from "react";
import { UserContext } from "@/lib/UserProvider";

export const Header = () => {
  return (
    <div className="px-8 py-3 flex flex-row-reverse items-center gap-x-4 border-b">
      <Navigation />
      <Bell />
    </div>
  );
};

const Navigation = () => {
  const user = useSelector((state: RootState) => state.user);
  const { logout } = useContext(UserContext);
  return (
    <Popover >
      <PopoverTrigger>
        <Avatar className="w-8 h-8 justify-self-end" >
          <AvatarImage src={decodeURIComponent(user.image)} />
          <AvatarFallback>{user.userName[0]}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col p-1 w-52">
        <a
          className="flex justify-start text-sm hover:no-underline hover:bg-accent p-2 gap-x-2 items-center"
          href={DESK}
        >
          Switch To Desk
          <ArrowRightLeft />
        </a>
        <Separator className="my-1" />
        <Button
          variant="link"
          className="flex justify-start hover:no-underline font-normal hover:bg-accent p-2 gap-x-2 items-center focus-visible:ring-0 focus-visible:ring-offset-0"
          onClick={logout}
        >
          Logout
          <LogOut />
        </Button>
      </PopoverContent>
    </Popover>
  );
};
