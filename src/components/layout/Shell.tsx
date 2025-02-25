
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface ShellProps {
  children: ReactNode;
}

export const Shell = ({ children }: ShellProps) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6 pt-20 lg:pt-6 lg:pl-80 overflow-auto">
          <div className="mx-auto max-w-7xl fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
