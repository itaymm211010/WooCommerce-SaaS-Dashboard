
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex flex-1 flex-col lg:pl-72">
          <TopBar />
          {/* Add proper spacing to prevent content from being hidden under the fixed TopBar */}
          <div className="flex-1 px-3 py-16 sm:px-4 sm:py-20 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
