
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Pages
import Index from "./pages/Index";
import ProfilePage from "./pages/profile/ProfilePage";
import ProjectManagement from "./pages/project-management/Index";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ImageManagementDemo from "./pages/demo/ImageManagementDemo";

// Store Pages
import StoresPage from "./pages/stores";
import OrdersPage from "./pages/stores/[id]/orders";
import OrderDetailsPage from "./pages/stores/[id]/orders/[orderId]/details";
import ProductsPage from "./pages/stores/[id]/products";
import ProductEditorPage from "./pages/stores/[id]/products/[productId]/edit";
import StoreUsersPage from "./pages/stores/[id]/users";
import StoreTaxonomiesPage from "./pages/stores/[id]/taxonomies";
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

function HandleInvites() {
  useEffect(() => {
    const handleMagicLink = async () => {
      const url = new URL(window.location.href);
      const searchParams = new URLSearchParams(url.hash.substring(1));
      
      if (searchParams.get('access_token')) {
        try {
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) throw error;
            
            const userData = data.user?.user_metadata;
            if (userData && userData.invite_to_store && userData.invite_role) {
              const { error: storeUserError } = await supabase
                .from('store_users')
                .insert({
                  store_id: userData.invite_to_store,
                  user_id: data.user?.id,
                  role: userData.invite_role,
                });
                
              if (storeUserError) throw storeUserError;
                
              toast.success("ברוך הבא! הצטרפת בהצלחה לחנות");
              
              window.location.href = `/stores/${userData.invite_to_store}/orders`;
            } else {
              toast.success("ברוך הבא! התחברת בהצלחה");
              
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } catch (error: any) {
          console.error("Error handling invitation:", error);
          toast.error(`אירעה שגיאה בעת הכניסה: ${error.message}`);
        }
      }
    };
    
    handleMagicLink();
  }, []);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <HandleInvites />
          <Routes>
            <Route 
              path="/" 
              element={
                <RequireAuth>
                  <Index />
                </RequireAuth>
              } 
            />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
            <Route path="/demo/image-management" element={<ImageManagementDemo />} />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="/project-management"
              element={
                <RequireAuth>
                  <ProjectManagement />
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
              path="/stores/:id/orders/:orderId/details"
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
              path="/stores/:id/products/:productId/edit"
              element={
                <RequireAuth>
                  <ProductEditorPage />
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
            <Route
              path="/stores/:id/taxonomies"
              element={
                <RequireAuth>
                  <StoreTaxonomiesPage />
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
