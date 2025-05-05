/**
 * External dependencies.
 */
import { Avatar, AvatarFallback, AvatarImage, Typography } from "@next-pms/design-system/components";
import { format, isYesterday, isToday } from "date-fns";

interface LastUpdatedProps {
  userName: string;
  timestamp: Date;
  avatar?: string;
  newDoc?: boolean;
}

/**
 * This component is used to show last updated information abou the current resource allocation.
 *
 * @param userName The name of the user.
 * @param timestamp Last updated timestamp string
 * @param avatar User image string .
 * @returns React.FC
 */
const LastUpdatedInfo = ({ userName, timestamp, avatar, newDoc = false }: LastUpdatedProps) => {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join("");

  let formattedTime: string;

  if (isToday(timestamp)) {
    formattedTime = `Today at ${format(timestamp, "h:mm a")}`;
  } else if (isYesterday(timestamp)) {
    formattedTime = `Yesterday at ${format(timestamp, "h:mm a")}`;
  } else {
    formattedTime = format(timestamp, "MMMM d 'at' h:mm a"); // e.g., April 21 at 10:30 AM
  }

  return (
    <div className="flex items-center w-full border-b gap-2 text-xs text-muted-foreground px-4 py-1 truncate">
      <Avatar className="h-6 w-6 border">
        <AvatarImage src={avatar || ""} alt={userName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col mt-1 items-start w-full">
        <Typography title={userName} variant="p" className="cursor-pointer font-medium text-[11.5px] truncate w-4/5 ">
          {userName}
        </Typography>
        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px]">
            {newDoc ? "Created" : "Last edit"} {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LastUpdatedInfo;
