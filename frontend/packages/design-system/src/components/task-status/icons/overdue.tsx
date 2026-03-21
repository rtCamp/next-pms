import { LucideProps } from "lucide-react";
import { mergeClassNames as cn } from "../../../utils";

export const Overdue = ({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  className,
  ...props
}: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    version="1.1"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={cn("lucide", className)}
    {...props}
  >
    <g fill="none" transform="matrix(.88093 0 0 .88093 1.429 2.959)">
      <path d="M12 6v6"></path>
      <path fill="none" d="M16.262-1.33H7.74"></path>
      <circle id="circle1" cx="12" cy="12" r="10" strokeOpacity="1"></circle>
    </g>
  </svg>
);
