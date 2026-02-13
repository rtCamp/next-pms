/**
 * External dependencies.
 */
import React from "react";
import ReactDOM from "react-dom/client";

/**
 * Internal dependencies.
 */
import App from "./app";
import "@next-pms/design-system/index.css";
import "@next-pms/resource-management/index.css";
import "./global.css";

if (import.meta.env.DEV) {
  fetch("/api/method/next_pms.www.next-pms.index.get_context_for_dev", {
    method: "POST",
  })
    .then((response) => response.json())
    .then((values) => {
      const v = JSON.parse(values.message);
      if (!window.frappe) window.frappe = {};
      window.frappe.boot = v;
    });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
