import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const themes = [
  { name: "Purple", value: "purple", class: "" },
  { name: "Blue", value: "blue", class: "theme-blue" },
  { name: "Green", value: "green", class: "theme-green" },
  { name: "Orange", value: "orange", class: "theme-orange" },
  { name: "Red", value: "red", class: "theme-red" },
  { name: "Rose", value: "rose", class: "theme-rose" },
  { name: "Violet", value: "violet", class: "theme-violet" },
];

// Convert HEX to HSL
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState("purple");
  const [customColor, setCustomColor] = useState("#8B5CF6");

  useEffect(() => {
    const savedTheme = localStorage.getItem("color-theme") || "purple";
    const savedCustomColor = localStorage.getItem("custom-color");
    
    setCurrentTheme(savedTheme);
    
    if (savedCustomColor) {
      setCustomColor(savedCustomColor);
      if (savedTheme === "custom") {
        applyCustomColor(savedCustomColor);
      }
    } else {
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (themeName: string) => {
    const theme = themes.find((t) => t.value === themeName);
    if (!theme) return;

    // Remove all theme classes and custom style
    themes.forEach((t) => {
      if (t.class) {
        document.documentElement.classList.remove(t.class);
      }
    });
    
    // Remove custom color style if exists
    const existingStyle = document.getElementById('custom-theme-style');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new theme class
    if (theme.class) {
      document.documentElement.classList.add(theme.class);
    }
  };

  const applyCustomColor = (color: string) => {
    // Remove all theme classes
    themes.forEach((t) => {
      if (t.class) {
        document.documentElement.classList.remove(t.class);
      }
    });

    const hsl = hexToHSL(color);
    const [h, s, l] = hsl.split(' ');
    const hue = parseInt(h);
    
    // Generate complementary colors
    const primaryHSL = hsl;
    const primaryForeground = "210 40% 98%";
    const secondaryHSL = `${hue} ${s} ${parseInt(l) + 10}%`;
    const accentHSL = `${(hue + 30) % 360} ${s} ${l}`;
    
    // Create or update style tag
    let styleTag = document.getElementById('custom-theme-style') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'custom-theme-style';
      document.head.appendChild(styleTag);
    }
    
    styleTag.textContent = `
      :root {
        --primary: ${primaryHSL};
        --primary-foreground: ${primaryForeground};
        --secondary: ${secondaryHSL};
        --accent: ${accentHSL};
      }
    `;
  };

  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName);
    localStorage.setItem("color-theme", themeName);
    
    if (themeName === "custom") {
      applyCustomColor(customColor);
    } else {
      applyTheme(themeName);
    }
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    localStorage.setItem("custom-color", color);
    
    if (currentTheme === "custom") {
      applyCustomColor(color);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Select color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
        <DropdownMenuSeparator />
        <div className="px-2 py-3 space-y-2">
          <Label htmlFor="custom-color" className="text-sm font-medium">
            Custom Color
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="custom-color"
              type="color"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="h-10 w-full cursor-pointer"
            />
            <Button
              size="sm"
              variant={currentTheme === "custom" ? "default" : "outline"}
              onClick={() => handleThemeChange("custom")}
            >
              Apply
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
