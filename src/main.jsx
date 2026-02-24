import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Catalog from "./catalog/Catalog";
import AppPage from "./catalog/AppPage";
import ExperienceShell from "./catalog/ExperienceShell";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/app/:appId" element={<AppPage />} />
        <Route path="/app/:appId/:expId" element={<ExperienceShell />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
