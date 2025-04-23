/**
 * External dependencies.
 */
import { Avatar, AvatarFallback, AvatarImage } from "@next-pms/design-system/components";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";

interface LastUpdatedProps {
  userName: string;
  timestamp: Date;
  avatar?: string;
  showFullDetails?: boolean;
}

/**
 * This component is used to show last updated information abou the current resource allocation.
 *
 * @param userName The name of the user.
 * @param timestamp Last updated timestamp string
 * @param avatar User image string .
 * @param showFullDetails Flag to control details.
 * @returns React.FC
 */
const LastUpdatedInfo = ({ userName, timestamp, avatar, showFullDetails = true }: LastUpdatedProps) => {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join("");

  const formattedDate = timestamp.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = timestamp.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground border rounded-md p-2.5 bg-muted/30">
      <Avatar className="h-7 w-7 border">
        <AvatarImage src={avatar ? avatar : ""} alt={userName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {showFullDetails ? (
          <>
            <p className="font-medium text-xs text-muted-foreground">Updated by {userName}</p>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">
                {formattedDate} at {formattedTime}
              </span>
            </div>
          </>
        ) : (
          <p className="font-medium">Updated {timeAgo}</p>
        )}
      </div>
    </div>
  );
};

export default LastUpdatedInfo;
