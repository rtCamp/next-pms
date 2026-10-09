import { createApp } from "vue";
import { setConfig, toast, type FrappeResourceError } from "frappe-ui";
import App from "./App.vue";
import { isLoggedIn, loadBoot, redirectToLogin } from "./boot";
import { router } from "./router";
import { createSocket, socketKey } from "./socket";
import "./style.css";

function stripHtml(html: string): string {
  return (
    new DOMParser().parseFromString(html, "text/html").body.textContent ?? ""
  );
}

function configureFrappeUI(boot: Boot) {
  setConfig("systemTimezone", boot.time_zone?.system);
  setConfig("localTimezone", boot.time_zone?.user);
  setConfig("maxFileSize", boot.max_file_size);
  setConfig("serverMessagesHandler", (messages) => {
    for (const raw of messages) {
      const { message } = JSON.parse(raw);
      if (message) toast(stripHtml(message));
    }
  });
  setConfig("fallbackErrorHandler", (error: FrappeResourceError) => {
    if (error.exc_type === "SessionExpired" || !isLoggedIn()) {
      redirectToLogin();
      return;
    }
    toast.error(stripHtml(error.messages?.join("\n") || error.message));
  });
}

async function init() {
  if (!isLoggedIn()) {
    redirectToLogin();
    return;
  }

  const boot = await loadBoot();
  configureFrappeUI(boot);

  const app = createApp(App).use(router);
  const socket = createSocket(boot);
  app.provide(socketKey, socket);
  app.config.globalProperties.$socket = socket;
  app.mount("#app");
}

init();
