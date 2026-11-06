export type Release = {
  version: string;
  date: string;
  html: string;
};

export type ReleaseNotes = {
  current_version: string;
  releases: Release[];
};
