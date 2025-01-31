/**
 * External dependencies.
 */
import ReactDOM from "react-dom/client";
import React from "react";


/**
 * Internal dependencies.
 */
import "@next-pms/design-system/index.css"
import "./global.css";
import App from "./app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
