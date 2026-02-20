import { cn } from "@/lib/utils";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  BarChart,
  Menu,
  X,
  User,
  Image,
  FolderTree,
  ClipboardList,
  Bot,
  Activity,
  Shield,
  BarChart3,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useStore } from "@/pages/stores/[id]/products/hooks/useStore";
import { useDirection } from "@/hooks/useDirection";

interface NavigationItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  needsStore?: boolean;
}

const globalNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orders", href: "/stores", icon: ShoppingCart, needsStore: true },
  { name: "Products", href: "/stores", icon: Package, needsStore: true },
  { name: "AI Chat", href: "/ai-chat", icon: Bot },
  { name: "סוכני AI", href: "/agents", icon: Cpu },
  { name: "Sync Monitoring", href: "/sync-monitoring", icon: Activity },
  { name: "Audit Logs", href: "/audit-logs", icon: Shield },
  { name: "Audit Analytics", href: "/audit-logs/analytics", icon: BarChart3 },
  { name: "Analytics", href: "/analytics", icon: BarChart },
  { name: "Stores", href: "/stores", icon: Store },
  { name: "Project Management", href: "/project-management", icon: ClipboardList },
  { name: "Profile", href: "/profile", icon: User },
];

const storeNavigation: NavigationItem[] = [
  { name: "Products", href: "/stores/:id/products", icon: Package },
  { name: "Orders", href: "/stores/:id/orders", icon: ShoppingCart },
  { name: "Taxonomies", href: "/stores/:id/taxonomies", icon: FolderTree },
  { name: "Analytics", href: "/stores/:id/analytics", icon: BarChart },
];

const Navigation = ({ isInStore, id, isRTL }: { isInStore: boolean; id?: string; isRTL: boolean }) => {
  const location = useLocation();
  const navigation = isInStore 
    ? storeNavigation.map(item => ({
        ...item,
        href: item.href.replace(':id', id!)
      }))
    : globalNavigation;

  return (
    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        {isInStore && (
          <li>
            <Link
              to="/stores"
              className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Store className="h-4 w-4" />
              <span>Back to Stores</span>
            </Link>
          </li>
        )}
        <li>
          <ul role="list" className="-mx-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              
              // אם זה לינק שדורש חנות ואנחנו בתפריט הגלובלי
              if (!isInStore && item.needsStore) {
                return null;
              }

              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-x-3 rounded-md p-2 text-sm leading-6",
                      "transition-colors duration-200",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                      isRTL && "flex-row-reverse"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
      </ul>
    </nav>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const { id } = useParams();
  const [open, setOpen] = useState(false);
  const direction = useDirection();
  const isRTL = direction === 'rtl';
  
  // הפיכת הבדיקה לboolean מפורש
  const isInStore = Boolean(location.pathname.includes('/stores/') && id);
  
  // טען את פרטי החנות אם אנחנו בתוך חנות
  const { data: store } = useStore(id);

  const sidebarContent = (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center border-b">
        <span className="text-xl font-semibold">SmartWoo</span>
      </div>
      {isInStore && store && (
        <div className="px-2 py-3 border-b">
          <div className="text-xs text-muted-foreground mb-1">חנות נוכחית</div>
          <div className="text-sm font-medium">{store.name}</div>
        </div>
      )}
      <Navigation isInStore={isInStore} id={id} isRTL={isRTL} />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col transition-all duration-300",
        isRTL ? "lg:right-0 lg:border-l" : "lg:left-0 lg:border-r"
      )}>
        {sidebarContent}
      </div>

      {/* Mobile Trigger & Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed start-2 top-2 z-50 h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side={isRTL ? 'right' : 'left'} className="w-72 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
};
