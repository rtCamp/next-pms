/**
 * External dependencies.
 */
import React from "react";
import ReactDOM from "react-dom/client";

/**
 * Internal dependencies.
 */
import App from "./app";
import "@next-pms/design-system/index.css"
import "./global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
