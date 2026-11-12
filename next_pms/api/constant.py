# What's new release notes
RELEASES_URL = "https://api.github.com/repos/rtCamp/next-pms/releases"
RELEASES_PER_PAGE = 100
REQUEST_TIMEOUT = 5

RELEASES_CACHE_KEY = "next_pms:whats_new:releases"
VERSIONS_CACHE_KEY = "next_pms:whats_new:versions"
FETCH_LOCK_KEY = "next_pms:whats_new:fetch_lock"
FETCH_RETRY_AFTER = 15 * 60

HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"]
DEVELOPER_SECTIONS = {"contributors", "references"}
