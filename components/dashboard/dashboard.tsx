"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatPanel } from "@/components/chat/chat-panel";
import { JournalPanel } from "@/components/journal/journal-panel";
import { HabitsPanel } from "@/components/habits/habits-panel";
import { AlarmsPanel } from "@/components/alarms/alarms-panel";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { cn } from "@/lib/utils";
import { useMobileViewport } from "@/hooks/use-mobile-viewport";
import { initDb } from "@/lib/db/db";

type ActivePanel = "chat" | "journal" | "habits" | "alarms" | "settings";

export function Dashboard() {
  const [activePanel, setActivePanel] = useState<ActivePanel>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMobileViewport();

  useEffect(() => {
    // Initialize the database when the component mounts
    const initializeDb = async () => {
      await initDb();
    };
    
    initializeDb();
    
    // Close sidebar on mobile by default
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activePanel={activePanel}
        onActivePanelChange={setActivePanel}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen}
          activePanel={activePanel}
        />
        
        <main className={cn(
          "flex-1 overflow-auto transition-all p-0 md:p-6",
          {
            "ml-0": !sidebarOpen || isMobile,
            "ml-64": sidebarOpen && !isMobile,
          }
        )}>
          {activePanel === "chat" && <ChatPanel />}
          {activePanel === "journal" && <JournalPanel />}
          {activePanel === "habits" && <HabitsPanel />}
          {activePanel === "alarms" && <AlarmsPanel />}
          {activePanel === "settings" && <SettingsPanel />}
        </main>
      </div>
    </div>
  );
}