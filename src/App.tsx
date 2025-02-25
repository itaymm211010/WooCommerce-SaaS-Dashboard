
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SignIn from "./pages/auth/SignIn";
import NotFound from "./pages/NotFound";
import StoresPage from "./pages/stores";
import StoreProductsPage from "./pages/stores/[id]/products";
import StoreOrdersPage from "./pages/stores/[id]/orders";

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">טוען...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  return children;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/signin" element={<SignIn />} />
    <Route
      path="/"
      element={
        <PrivateRoute>
          <Index />
        </PrivateRoute>
      }
    />
    <Route
      path="/orders"
      element={
        <PrivateRoute>
          <Index />
        </PrivateRoute>
      }
    />
    <Route
      path="/products"
      element={
        <PrivateRoute>
          <Index />
        </PrivateRoute>
      }
    />
    <Route
      path="/analytics"
      element={
        <PrivateRoute>
          <Index />
        </PrivateRoute>
      }
    />
    <Route
      path="/stores"
      element={
        <PrivateRoute>
          <StoresPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/stores/:id/products"
      element={
        <PrivateRoute>
          <StoreProductsPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/stores/:id/orders"
      element={
        <PrivateRoute>
          <StoreOrdersPage />
        </PrivateRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
