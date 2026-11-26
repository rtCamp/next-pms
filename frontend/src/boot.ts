export function isLoggedIn(): boolean {
  const user = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("user_id="))
    ?.slice("user_id=".length);
  return Boolean(user) && user !== "Guest";
}

export function redirectToLogin(): void {
  const redirectTo = window.location.pathname + window.location.search;
  window.location.replace(
    `/login?redirect-to=${encodeURIComponent(redirectTo)}`,
  );
}

export async function loadBoot(): Promise<Boot> {
  if (window.boot) return window.boot;

  const response = await fetch(
    "/api/method/next_pms.www.next-pms.index.get_context_for_dev",
    { method: "POST" },
  );
  const { message } = await response.json();
  // get_context_for_dev returns the boot JSON encoded as a string.
  window.boot = typeof message === "string" ? JSON.parse(message) : message;
  return window.boot!;
}
