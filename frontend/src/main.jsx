import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import './index.css'; 
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "@/components/provider/theme";
import { AuthProvider } from "@/hooks/AuthProvider";

createRoot(document.getElementById("root")).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  </ThemeProvider>
);
