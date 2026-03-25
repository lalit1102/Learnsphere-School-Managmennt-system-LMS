"use client";

import { Moon, Sun, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "@/components/provider/theme";

export const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div
      className={cn(
        "gap-2",
        isCollapsed ? "flex-row space-y-2" : "flex justify-end"
      )}
    >
      {/* Light Theme */}
      <SidebarMenuItem title="Choose Light Theme">
        <Button
          size="icon-sm"
          variant={theme === "light" ? "outline" : "ghost"}
          onClick={() => setTheme("light")}
        >
          <Sun />
        </Button>
      </SidebarMenuItem>

      {/* Dark Theme */}
      <SidebarMenuItem title="Choose Dark Theme">
        <Button
          size="icon-sm"
          variant={theme === "dark" ? "outline" : "ghost"}
          onClick={() => setTheme("dark")}
        >
          <Moon />
        </Button>
      </SidebarMenuItem>

      {/* System Theme */}
      <SidebarMenuItem title="Choose System Theme">
        <Button
          size="icon-sm"
          variant={theme === "system" ? "outline" : "ghost"}
          onClick={() => setTheme("system")}
        >
          <Laptop />
        </Button>
      </SidebarMenuItem>
    </div>
  );
};
