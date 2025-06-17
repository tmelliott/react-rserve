import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./global.css";

import App from "./App.tsx";

import { RserveProvider } from "./utils/rserve";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RserveProvider>
      <App />
    </RserveProvider>
  </StrictMode>
);
