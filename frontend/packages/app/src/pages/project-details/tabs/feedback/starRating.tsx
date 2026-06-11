import { useId } from "react";

type DecimalStarProps = {
  index: number;
  rating: number;
  activeColor: string;
  inactiveColor: string;
  size: number;
  instanceId: string;
};

type StarRatingProps = {
  rating: number;
  totalStars?: number;
  activeColor?: string;
  inactiveColor?: string;
  size?: number;
};

export default function StarRating({
  rating = 0,
  totalStars = 5,
  activeColor = "#E79913",
  inactiveColor = "#E2E2E2",
  size = 24,
}: StarRatingProps) {
  const instanceId = useId();
  // Ensure rating falls within the total boundaries
  const validatedRating = Math.max(0, Math.min(rating, totalStars));

  return (
    <div className="flex items-center">
      {Array.from({ length: totalStars }).map((_, index) => (
        <DecimalStar
          key={index}
          index={index}
          rating={validatedRating}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          size={size}
          instanceId={instanceId}
        />
      ))}
    </div>
  );
}

/**
 * Individual Star Sub-component using SVG linear gradients for fractional fill
 */
const DecimalStar = ({
  index,
  rating,
  activeColor,
  inactiveColor,
  size,
  instanceId,
}: DecimalStarProps) => {
  const fillId = `star-fill-${instanceId}-${index}`;

  // Calculate fill percentage for the specific star
  let fillPercentage = 0;
  if (rating >= index + 1) {
    // Fully filled
    fillPercentage = 100;
  } else if (rating > index) {
    // Fractionally filled (e.g., 0.4 -> 40%)
    fillPercentage = (rating - index) * 100;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="inline-block"
    >
      <defs>
        <linearGradient id={fillId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset={`${fillPercentage}%`} stopColor={activeColor} />
          <stop offset={`${fillPercentage}%`} stopColor={inactiveColor} />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${fillId})`}
        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
};
