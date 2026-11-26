/** What an empty field shows. */
export const EMPTY = "—";

export const PRIORITY_OPTIONS = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

export const COMPLEXITY_OPTIONS = [
  { label: EMPTY, value: "" },
  { label: "C1", value: "C1" },
  { label: "C2", value: "C2" },
  { label: "C3", value: "C3" },
];

export const KEY_ACCOUNT_OPTIONS = [
  { label: EMPTY, value: "" },
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

/** A Check field edited as a select: `"1"` or `"0"`. */
export const YES_NO_OPTIONS = [
  { label: "Yes", value: "1" },
  { label: "No", value: "0" },
];

/** Project fields from other apps the Sourcing section shows, when the site has them. */
export const SOURCING_FIELDS = [
  "custom_source",
  "custom_territory",
  "custom_previous_cms",
] as const;

export const TIME_REPORT_FREQUENCY_DOCTYPE = "Project Time Report Frequency";
