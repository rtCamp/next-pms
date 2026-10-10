export interface CardProps {
  /** Heading shown at the top left, rendered as an `h2`. */
  title?: string;
  /** Secondary line under the heading. */
  subtitle?: string;
  /** Replaces the default slot with a loading indicator and marks the card busy. */
  loading?: boolean;
}
