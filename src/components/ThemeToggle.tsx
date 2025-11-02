import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const [theme, setTheme] = useState<string>("default");

  useEffect(() => {
    const savedTheme = localStorage.getItem("color-theme") || "default";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeName: string) => {
    if (themeName === "mint") {
      document.documentElement.setAttribute("data-theme", "mint");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("color-theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="w-4 h-4" />
          Theme
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeTheme("default")}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
            <span>Default (Cyan)</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeTheme("mint")}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-teal-400" />
            <span>Mint Colors (Bright)</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
