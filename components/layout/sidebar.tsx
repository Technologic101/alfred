"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  BookText,
  Activity,
  Bell,
  Settings,
  X
} from "lucide-react";
import { useMobileViewport } from "@/hooks/use-mobile-viewport";

type ActivePanel = "chat" | "journal" | "habits" | "alarms" | "settings";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePanel: ActivePanel;
  onActivePanelChange: (panel: ActivePanel) => void;
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  activePanel, 
  onActivePanelChange 
}: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileViewport();
  
  useEffect(() => {
    // Close sidebar when clicking outside on mobile
    function handleClickOutside(event: MouseEvent) {
      if (
        isMobile &&
        isOpen &&
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, isOpen, onClose]);

  const navItems = [
    { id: "chat", label: "Life Coach Chat", icon: MessageSquare },
    { id: "journal", label: "Journal", icon: BookText },
    { id: "habits", label: "Habit Tracker", icon: Activity },
    { id: "alarms", label: "Alarms & Check-ins", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-lg transform transition-transform duration-300 ease-in-out",
        {
          "translate-x-0": isOpen,
          "-translate-x-full": !isOpen,
        }
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold">Lifely</h2>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activePanel === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-left font-normal",
                {
                  "bg-primary text-primary-foreground": activePanel === item.id,
                }
              )}
              onClick={() => {
                onActivePanelChange(item.id as ActivePanel);
                if (isMobile) onClose();
              }}
            >
              <Icon className="mr-2 h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}