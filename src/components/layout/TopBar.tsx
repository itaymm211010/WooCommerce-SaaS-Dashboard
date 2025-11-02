import { Button } from "@/components/ui/button";
import { Bell, Settings, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ThemeSelector } from "./ThemeSelector";
import { LanguageSelector } from "./LanguageSelector";
import { useTranslation } from "react-i18next";
import { useDirection } from "@/hooks/useDirection";
import { cn } from "@/lib/utils";

export const TopBar = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const direction = useDirection();
  const isRTL = direction === 'rtl';

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t('common.success'));
      navigate("/auth/signin");
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  return (
    <header className={cn(
      "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "fixed w-full top-0 z-40 transition-all duration-300",
      isRTL ? "lg:pr-72" : "lg:pl-72"
    )}>
      <div className="flex h-14 sm:h-16 items-center px-4 sm:px-6 gap-2 sm:gap-4">
        <div className="lg:hidden w-12" /> {/* Spacing for mobile menu button */}
        <div className="flex flex-1 items-center justify-between">
          <div />
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSelector />
            <ThemeSelector />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 sm:h-10 sm:w-10">
              {theme === "dark" ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="h-8 w-8 sm:h-10 sm:w-10"
                title={t('common.logout')}
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
