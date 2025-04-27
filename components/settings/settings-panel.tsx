"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Globe, 
  Database,
  Mic,
  Volume2,
  Bot,
  Bell,
  ShieldCheck,
  HardDrive,
  Download,
  Trash2,
  Save
} from "lucide-react";
import { getDb } from "@/lib/db/db";

interface Settings {
  id: string;
  value: any;
}

export function SettingsPanel() {
  const [settings, setSettings] = useState({
    // Voice settings
    voiceInput: true,
    voiceOutput: true,
    voiceRate: 1,
    voicePitch: 1,
    
    // LLM settings
    useLocalLLM: false,
    llmEndpoint: "http://localhost:11434",
    llmModel: "llama2",
    
    // Web search settings
    enableWebSearch: true,
    
    // Notification settings
    enableNotifications: true,
    
    // Database settings
    autoBackup: false,
    backupInterval: "weekly",
    
    // Privacy settings
    enableTelemetry: false,
    storeDataLocally: true,
  });
  
  // Load settings from IndexedDB
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const db = await getDb();
        const allSettings = await db.getAll('settings');
        
        // Convert array of settings to object
        const settingsObj = {};
        allSettings.forEach((setting: Settings) => {
          settingsObj[setting.id] = setting.value;
        });
        
        // Merge with defaults
        setSettings(prev => ({
          ...prev,
          ...settingsObj
        }));
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      }
    };
    
    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      const db = await getDb();
      
      // Save each setting
      for (const [key, value] of Object.entries(settings)) {
        await db.put('settings', {
          id: key,
          value
        });
      }
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const clearAllData = async () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      try {
        // Delete the database and recreate it
        const db = await getDb();
        
        // Clear all object stores
        await db.clear('chats');
        await db.clear('journal');
        await db.clear('habits');
        await db.clear('alarms');
        
        // Don't clear settings as we want to preserve them
        
        toast.success("All data cleared successfully");
      } catch (error) {
        console.error("Error clearing data:", error);
        toast.error("Failed to clear data");
      }
    }
  };

  return (
    <div className="container max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <Tabs defaultValue="voice">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="voice" className="flex items-center gap-1">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Voice</span>
          </TabsTrigger>
          <TabsTrigger value="llm" className="flex items-center gap-1">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">AI Model</span>
          </TabsTrigger>
          <TabsTrigger value="web" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Web Search</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          {/* Voice Settings */}
          <TabsContent value="voice">
            <Card>
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription>
                  Configure voice input and output settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voice Input</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow voice recording for input
                    </p>
                  </div>
                  <Switch
                    checked={settings.voiceInput}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, voiceInput: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voice Output</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow text-to-speech for responses
                    </p>
                  </div>
                  <Switch
                    checked={settings.voiceOutput}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, voiceOutput: checked }))}
                  />
                </div>
                
                {settings.voiceOutput && (
                  <>
                    <div className="space-y-2">
                      <Label>Speech Rate</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Slow</span>
                        <Input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={settings.voiceRate}
                          onChange={(e) => setSettings(prev => ({ ...prev, voiceRate: parseFloat(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">Fast</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Voice Pitch</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Low</span>
                        <Input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={settings.voicePitch}
                          onChange={(e) => setSettings(prev => ({ ...prev, voicePitch: parseFloat(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground">High</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Voice Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* LLM Settings */}
          <TabsContent value="llm">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Settings</CardTitle>
                <CardDescription>
                  Configure the AI model used for responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Use Local LLM</Label>
                    <p className="text-sm text-muted-foreground">
                      Use a locally hosted language model instead of cloud services
                    </p>
                  </div>
                  <Switch
                    checked={settings.useLocalLLM}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useLocalLLM: checked }))}
                  />
                </div>
                
                {settings.useLocalLLM && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="llm-endpoint">LLM Endpoint</Label>
                      <Input
                        id="llm-endpoint"
                        value={settings.llmEndpoint}
                        onChange={(e) => setSettings(prev => ({ ...prev, llmEndpoint: e.target.value }))}
                        placeholder="http://localhost:11434"
                      />
                      <p className="text-xs text-muted-foreground">
                        The API endpoint for your local LLM (e.g., Ollama)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="llm-model">LLM Model</Label>
                      <Select
                        value={settings.llmModel}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, llmModel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="llama2">Llama 2</SelectItem>
                          <SelectItem value="mistral">Mistral</SelectItem>
                          <SelectItem value="vicuna">Vicuna</SelectItem>
                          <SelectItem value="wizardlm">WizardLM</SelectItem>
                          <SelectItem value="orca2">Orca 2</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        The model to use for generating responses
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save AI Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Web Search Settings */}
          <TabsContent value="web">
            <Card>
              <CardHeader>
                <CardTitle>Web Search Settings</CardTitle>
                <CardDescription>
                  Configure web search capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Web Search</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow the assistant to search the web for information
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableWebSearch}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableWebSearch: checked }))}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Web Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how notifications are delivered
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for alarms and reminders
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => {
                      // Request permission if enabling
                      if (checked && Notification.permission !== "granted") {
                        Notification.requestPermission();
                      }
                      
                      setSettings(prev => ({ ...prev, enableNotifications: checked }));
                    }}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Data Settings */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Manage your data and backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Regularly backup your data to local storage
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
                  />
                </div>
                
                {settings.autoBackup && (
                  <div className="space-y-2">
                    <Label htmlFor="backup-interval">Backup Interval</Label>
                    <Select
                      value={settings.backupInterval}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, backupInterval: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2 pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                </div>
                
                <div className="space-y-2 pt-4">
                  <Button variant="destructive" className="w-full" onClick={clearAllData}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will permanently delete all your data and cannot be undone.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Data Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Configure privacy and data storage options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anonymous Usage Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Share anonymous usage statistics to help improve the app
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableTelemetry}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableTelemetry: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Local Storage Only</Label>
                    <p className="text-sm text-muted-foreground">
                      Store all data on your device only, never on external servers
                    </p>
                  </div>
                  <Switch
                    checked={settings.storeDataLocally}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, storeDataLocally: checked }))}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Privacy Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}