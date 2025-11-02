
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";
import { useDirection } from "@/hooks/useDirection";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [isMounted, setIsMounted] = useState(false);
  const direction = useDirection();
  const isRTL = direction === 'rtl';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Sidebar />
      <TopBar />
      <main className={cn(
        "flex flex-1 flex-col transition-all duration-300",
        isRTL ? "lg:pr-72" : "lg:pl-72"
      )}>
        {/* Add proper spacing to prevent content from being hidden under the fixed TopBar */}
        <div className="flex-1 px-3 py-16 sm:px-4 sm:py-20 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
