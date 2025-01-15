/**
 * External dependencies.
 */
import React from "react";
import ReactDOM from "react-dom/client";

/**
 * Internal dependencies.
 */
import App from "./App";
import "./global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
