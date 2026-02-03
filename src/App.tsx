import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MatrixSettingsProvider } from "./contexts/MatrixSettingsContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Architecture from "./pages/Architecture";
import HQ from "./pages/HQ";
import { ImageEditor } from "./components/ImageEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MatrixSettingsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HQ />} />
            <Route path="/chat" element={<Index />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/editor" element={<ImageEditor />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </MatrixSettingsProvider>
  </QueryClientProvider>
);

export default App;
