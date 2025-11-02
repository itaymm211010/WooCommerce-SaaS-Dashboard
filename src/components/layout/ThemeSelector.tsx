import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

const themes = [
  { name: "Purple", value: "purple", class: "" },
  { name: "Blue", value: "blue", class: "theme-blue" },
  { name: "Green", value: "green", class: "theme-green" },
  { name: "Orange", value: "orange", class: "theme-orange" },
  { name: "Red", value: "red", class: "theme-red" },
  { name: "Rose", value: "rose", class: "theme-rose" },
  { name: "Violet", value: "violet", class: "theme-violet" },
];

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState("purple");

  useEffect(() => {
    const savedTheme = localStorage.getItem("color-theme") || "purple";
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeName: string) => {
    const theme = themes.find((t) => t.value === themeName);
    if (!theme) return;

    // Remove all theme classes
    themes.forEach((t) => {
      if (t.class) {
        document.documentElement.classList.remove(t.class);
      }
    });

    // Add new theme class
    if (theme.class) {
      document.documentElement.classList.add(theme.class);
    }
  };

  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName);
    localStorage.setItem("color-theme", themeName);
    applyTheme(themeName);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Select color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => handleThemeChange(theme.value)}
            className="flex items-center justify-between"
          >
            <span>{theme.name}</span>
            {currentTheme === theme.value && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
