import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import React from "react";
import { LanguageProvider } from "@/lib/i18n";
import Home from "./pages/Home";
import PracticeRoom from "./pages/PracticeRoom";
import TakeawayPage from "./pages/TakeawayPage";
import MyPage from "./pages/MyPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Surfaces render crashes on-screen instead of a blank white page.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, fontFamily: "monospace", color: "#b91c1c", whiteSpace: "pre-wrap" }}>
          <h2 style={{ fontWeight: 800 }}>App crashed</h2>
          <p style={{ fontWeight: 700 }}>{this.state.error.message}</p>
          <pre style={{ fontSize: 12, color: "#7f1d1d", overflow: "auto" }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <React.StrictMode>
      <HashRouter>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/practice" element={<PracticeRoom />} />
                <Route path="/session-end" element={<TakeawayPage />} />
                <Route path="/my" element={<MyPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </TooltipProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </HashRouter>
    </React.StrictMode>
  );
}

export default App;
