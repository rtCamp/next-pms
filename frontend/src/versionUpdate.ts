import { toast } from "frappe-ui";
import type { Socket } from "socket.io-client";

/** Tells the user to reload when Frappe announces a new version of the app. */
export function notifyVersionUpdates(socket: Pick<Socket, "on">): void {
  socket.on("version-update", () => {
    toast.info(
      "New version available. Please refresh the page to get the latest version.",
      {
        duration: 10000,
        action: { label: "Reload", onClick: () => window.location.reload() },
      },
    );
  });
}
