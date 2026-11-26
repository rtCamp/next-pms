export interface Release {
  version: string;
  /** `YYYY-MM-DD` */
  date: string;
  /** The release notes, cleaned by the server. */
  html: string;
}

export interface ReleaseNotes {
  current_version: string;
  /** Installed releases, newest first. */
  releases: Release[];
}
