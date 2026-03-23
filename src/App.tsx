import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/store/authStore";
import { useRoleStore } from "@/store/roleStore";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Deliveries from "@/pages/Deliveries";
import NewDelivery from "@/pages/NewDelivery";
import EditDelivery from "@/pages/EditDelivery";
import DeliveryDetail from "@/pages/DeliveryDetail";
import Clients from "@/pages/Clients";
import UserPermissions from "@/pages/UserPermissions";
import NotFound from "./pages/NotFound.tsx";
import DeliveriesDay from './pages/DeliveriesDays.tsx';
import DeliveriesEncours from './pages/DeleveryEnCours.tsx';

const queryClient = new QueryClient();

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchRole = useRoleStore((s) => s.fetchRole);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) fetchRole();
  }, [isAuthenticated, fetchRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireCreateDeliveryRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const canCreateDeliveries = useRoleStore((s) => s.canCreateDeliveries);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return canCreateDeliveries ? <>{children}</> : <Navigate to="/" replace />;
}

function RequireUpdateDeliveryRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const canUpdate = useRoleStore((s) => s.canUpdateDeliveries);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return canUpdate ? <>{children}</> : <Navigate to="/" replace />;
}

function RequireSuperAdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSuperAdmin = useRoleStore((s) => s.isSuperAdmin);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isSuperAdmin ? <>{children}</> : <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthInitializer>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="deliveries" element={<Deliveries />} />
              <Route path="deliveriesDay" element={<DeliveriesDay />} />
              <Route path="deliveriesPending" element={<DeliveriesEncours />} />
              <Route path="deliveries/new" element={<RequireCreateDeliveryRoute><NewDelivery /></RequireCreateDeliveryRoute>} />
              <Route path="deliveries/:id/edit" element={<RequireUpdateDeliveryRoute><EditDelivery /></RequireUpdateDeliveryRoute>} />
              <Route path="deliveries/:id" element={<DeliveryDetail />} />
              <Route path="clients" element={<Clients />} />
              <Route path="permissions" element={<RequireSuperAdminRoute><UserPermissions /></RequireSuperAdminRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;