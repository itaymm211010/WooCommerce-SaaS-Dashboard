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
  FolderTree
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

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
  { name: "Analytics", href: "/analytics", icon: BarChart },
  { name: "Stores", href: "/stores", icon: Store },
  { name: "Profile", href: "/profile", icon: User },
  { name: "ניהול תמונות", href: "/demo/image-management", icon: Image },
];

const storeNavigation: NavigationItem[] = [
  { name: "Products", href: "/stores/:id/products", icon: Package },
  { name: "Orders", href: "/stores/:id/orders", icon: ShoppingCart },
  { name: "Taxonomies", href: "/stores/:id/taxonomies", icon: FolderTree },
  { name: "Analytics", href: "/stores/:id/analytics", icon: BarChart },
];

const Navigation = ({ isInStore, id }: { isInStore: boolean; id?: string }) => {
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
              className="mb-4 flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <Store className="mr-2 h-4 w-4" />
              Back to Stores
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
                      "flex gap-x-3 rounded-md p-2 text-sm leading-6",
                      "transition-colors duration-200",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
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
  
  // הפיכת הבדיקה לboolean מפורש
  const isInStore = Boolean(location.pathname.includes('/stores/') && id);

  const sidebarContent = (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-background px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <span className="text-xl font-semibold">SmartWoo</span>
      </div>
      <Navigation isInStore={isInStore} id={id} />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        {sidebarContent}
      </div>

      {/* Mobile Trigger & Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed left-4 top-4 z-50"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
};
