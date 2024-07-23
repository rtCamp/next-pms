import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Bell } from "lucide-react";
export const Header = () => {
  const user = useSelector((state: RootState) => state.user);

  return (
    <div className="px-8 py-3 flex flex-row-reverse items-center gap-x-4 border-b">
      <Avatar className="w-8 h-8 justify-self-end">
        <AvatarImage src={decodeURIComponent(user.image)} />
        <AvatarFallback>{user.userName[0]}</AvatarFallback>
      </Avatar>
      <Bell />
    </div>
  );
};
