
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";

export const TopBar = () => {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed w-full top-0 z-40 lg:left-72 lg:w-[calc(100%-288px)]">
      <div className="flex h-16 items-center px-6 gap-4">
        <div className="lg:hidden w-8" /> {/* Spacing for mobile menu button */}
        <div className="flex flex-1 items-center justify-between">
          <div />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
