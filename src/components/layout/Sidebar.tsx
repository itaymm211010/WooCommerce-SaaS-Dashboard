
import { cn } from "@/lib/utils";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  BarChart
} from "lucide-react";

const globalNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: Package },
  { name: "Analytics", href: "/analytics", icon: BarChart },
  { name: "Stores", href: "/stores", icon: Store },
];

const storeNavigation = [
  { name: "Products", href: "/stores/:id/products", icon: Package },
  { name: "Orders", href: "/stores/:id/orders", icon: ShoppingCart },
  { name: "Analytics", href: "/stores/:id/analytics", icon: BarChart },
];

export const Sidebar = () => {
  const location = useLocation();
  const { id } = useParams();
  
  // בודק אם אנחנו בתוך חנות ספציפית
  const isInStore = location.pathname.includes('/stores/') && id;
  
  // בוחר את התפריט המתאים בהתאם למיקום
  const navigation = isInStore 
    ? storeNavigation.map(item => ({
        ...item,
        href: item.href.replace(':id', id!)
      }))
    : globalNavigation;

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <span className="text-xl font-semibold">SmartWoo</span>
        </div>
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
      </div>
    </div>
  );
};
