import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "@/store/AppContext";
import { ToastContainer } from "@/app/Toast";
import { GalleryView } from "@/views/GalleryView";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider>
      <GalleryView />
      <ToastContainer />
    </AppProvider>
  </React.StrictMode>
);
