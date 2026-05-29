import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import React from "react";
import Home from "./pages/Home";
import PracticeRoom from "./pages/PracticeRoom";
import TakeawayPage from "./pages/TakeawayPage";
import MyPage from "./pages/MyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <React.StrictMode>
      <HashRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/practice" element={<PracticeRoom />} />
              <Route path="/session-end" element={<TakeawayPage />} />
              <Route path="/my" element={<MyPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </QueryClientProvider>
      </HashRouter>
    </React.StrictMode>
  );
}

export default App;
