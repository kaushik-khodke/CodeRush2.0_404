import React from "react";
import ReactDOM from "react-dom/client";
import { SeedingDashboard } from "./components/seeding/SeedingDashboard";
import "./styles.css";

const rootElement = document.getElementById("seeding-root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <SeedingDashboard />
    </React.StrictMode>
  );
}
