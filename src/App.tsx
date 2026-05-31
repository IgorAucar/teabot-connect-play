import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppStateProvider } from "@/hooks/useAppState";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import ChatPage from "./pages/ChatPage.tsx";
import Progress from "./pages/Progress.tsx";
import About from "./pages/About.tsx";
import TherapistDashboard from "./pages/TherapistDashboard.tsx";
import Reports from "./pages/Reports.tsx";
import MyReports from "./pages/MyReports.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppStateProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/sobre" element={<About />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireRole="child">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:activityId"
                element={
                  <ProtectedRoute requireRole="child">
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/progresso"
                element={
                  <ProtectedRoute requireRole="child">
                    <Progress />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/terapeuta"
                element={
                  <ProtectedRoute requireRole="therapist">
                    <TherapistDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppStateProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
