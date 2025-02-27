
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import ProfilePage from "./pages/profile/ProfilePage";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

// Store Pages
import StoresPage from "./pages/stores";
import OrdersPage from "./pages/stores/[id]/orders";
import OrderDetailsPage from "./pages/stores/[id]/orders/[orderId]/details";
import ProductsPage from "./pages/stores/[id]/products";
import StoreUsersPage from "./pages/stores/[id]/users";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="/stores"
              element={
                <RequireAuth>
                  <StoresPage />
                </RequireAuth>
              }
            />
            <Route
              path="/stores/:id/orders"
              element={
                <RequireAuth>
                  <OrdersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/stores/:id/orders/:orderId"
              element={
                <RequireAuth>
                  <OrderDetailsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/stores/:id/products"
              element={
                <RequireAuth>
                  <ProductsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/stores/:id/users"
              element={
                <RequireAuth>
                  <StoreUsersPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
