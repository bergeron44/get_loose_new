import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { GameProvider } from "@/contexts/GameContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BarDashboard from "./pages/BarDashboard";
import BarRegistration from "./pages/BarRegistration";
import QuestionsDashboard from "./pages/QuestionsDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <GameProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/index.html" element={<Navigate to="/" replace />} />
              <Route path="/dashboard" element={<BarDashboard />} />
              <Route path="/dashboard/register" element={<BarRegistration />} />
              <Route path="/questions-dashboard" element={<QuestionsDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </GameProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
