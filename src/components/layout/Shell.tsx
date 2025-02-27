
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
        <main className="flex flex-1 flex-col lg:pr-72">
          <TopBar />
          {/* הוספת padding-top כדי למנוע הסתרת תוכן מהכותרת הקבועה */}
          <div className="pt-16 flex-1 container mx-auto pb-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
