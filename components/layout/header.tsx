"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  activePanel: string;
}

export function Header({ toggleSidebar, sidebarOpen, activePanel }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);

  const getPanelTitle = () => {
    switch (activePanel) {
      case "chat":
        return "Life Coach Chat";
      case "journal":
        return "Journal";
      case "habits":
        return "Habit Tracker";
      case "alarms":
        return "Alarms & Check-ins";
      case "settings":
        return "Settings";
      default:
        return "Lifely Assistant";
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background border-b">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <h1 className="text-xl font-semibold">{getPanelTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <VoiceRecorder 
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="ml-2"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}