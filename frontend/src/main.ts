import { createApp } from "vue";
import { setConfig, toast, type FrappeResourceError } from "frappe-ui";
import App from "./App.vue";
import { isLoggedIn, loadBoot, redirectToLogin } from "./boot";
import { router } from "./router";
import { createSocket, socketKey } from "./socket";
import { stripHtml } from "./utils/text";
import { seedColorScheme } from "./utils/theme";
import "./style.css";

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
  seedColorScheme(boot.desk_theme);

  const app = createApp(App).use(router);
  app.provide(socketKey, createSocket(boot));
  app.mount("#app");
}

init();
