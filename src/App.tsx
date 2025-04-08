
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Lessons from "./pages/Lessons";
import Practice from "./pages/Practice";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import LessonDetail from "./pages/LessonDetail";
import LessonLearning from "./pages/LessonLearning";
import React from "react";

// Create a fresh query client instance
const queryClient = new QueryClient();

// Create a functional component to wrap our app
function App() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/lessons" element={<Lessons />} />
              <Route path="/lessons/:lessonId" element={<LessonDetail />} />
              <Route path="/lessons/:lessonId/learn" element={<LessonLearning />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

export default App;
