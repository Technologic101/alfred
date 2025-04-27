"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Bell, ClockIcon, Trash, SquarePen } from "lucide-react";
import { v4 as uuidv4 } from "@/lib/utils/uuid";
import { getDb } from "@/lib/db/db";
import { cn } from "@/lib/utils";

interface Alarm {
  id: string;
  time: string;
  label: string;
  days: number[]; // 0-6, where 0 is Sunday
  isEnabled: boolean;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AlarmsPanel() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAlarm, setCurrentAlarm] = useState<Alarm | null>(null);
  const [newAlarm, setNewAlarm] = useState<Partial<Alarm>>({
    time: '09:00',
    label: '',
    days: [],
    isEnabled: true,
    isRecurring: false,
  });

  // Load alarms from IndexedDB
  useEffect(() => {
    const loadAlarms = async () => {
      try {
        const db = await getDb();
        const allAlarms = await db.getAll('alarms');
        
        // Sort by time
        allAlarms.sort((a, b) => a.time.localeCompare(b.time));
        
        setAlarms(allAlarms);
      } catch (error) {
        console.error("Error loading alarms:", error);
        toast.error("Failed to load alarms");
      }
    };
    
    loadAlarms();
  }, []);

  const handleCreateAlarm = async () => {
    if (!newAlarm.time || !newAlarm.label) {
      toast.error("Please enter a time and label");
      return;
    }
    
    try {
      const alarm: Alarm = {
        id: uuidv4(),
        time: newAlarm.time,
        label: newAlarm.label,
        days: newAlarm.isRecurring ? newAlarm.days || [] : [],
        isEnabled: newAlarm.isEnabled !== undefined ? newAlarm.isEnabled : true,
        isRecurring: newAlarm.isRecurring || false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to database
      const db = await getDb();
      await db.add('alarms', alarm);
      
      // Update state
      setAlarms(prev => [...prev, alarm].sort((a, b) => a.time.localeCompare(b.time)));
      
      // Reset form
      setNewAlarm({
        time: '09:00',
        label: '',
        days: [],
        isEnabled: true,
        isRecurring: false,
      });
      
      setIsCreating(false);
      toast.success("Alarm created");
      
      // Request notification permission if needed
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    } catch (error) {
      console.error("Error creating alarm:", error);
      toast.error("Failed to create alarm");
    }
  };

  const handleUpdateAlarm = async () => {
    if (!currentAlarm || !currentAlarm.time || !currentAlarm.label) return;
    
    try {
      const updatedAlarm = {
        ...currentAlarm,
        days: currentAlarm.isRecurring ? currentAlarm.days : [],
        updatedAt: new Date()
      };
      
      // Save to database
      const db = await getDb();
      await db.put('alarms', updatedAlarm);
      
      // Update state
      setAlarms(prev => 
        prev.map(alarm => 
          alarm.id === updatedAlarm.id ? updatedAlarm : alarm
        ).sort((a, b) => a.time.localeCompare(b.time))
      );
      
      setIsEditing(false);
      toast.success("Alarm updated");
    } catch (error) {
      console.error("Error updating alarm:", error);
      toast.error("Failed to update alarm");
    }
  };

  const handleToggleAlarm = async (id: string, isEnabled: boolean) => {
    try {
      const db = await getDb();
      const alarm = await db.get('alarms', id);
      
      if (alarm) {
        alarm.isEnabled = isEnabled;
        alarm.updatedAt = new Date();
        
        await db.put('alarms', alarm);
        
        // Update state
        setAlarms(prev => 
          prev.map(a => a.id === id ? { ...a, isEnabled } : a)
        );
        
        toast.success(isEnabled ? "Alarm enabled" : "Alarm disabled");
      }
    } catch (error) {
      console.error("Error toggling alarm:", error);
      toast.error("Failed to update alarm");
    }
  };

  const handleDeleteAlarm = async (id: string) => {
    try {
      const db = await getDb();
      await db.delete('alarms', id);
      
      // Update state
      setAlarms(prev => prev.filter(alarm => alarm.id !== id));
      
      toast.success("Alarm deleted");
    } catch (error) {
      console.error("Error deleting alarm:", error);
      toast.error("Failed to delete alarm");
    }
  };

  const handleDayToggle = (days: string[], entryState: 'new' | 'current') => {
    const numericDays = days.map(d => parseInt(d));
    
    if (entryState === 'new') {
      setNewAlarm(prev => ({
        ...prev,
        days: numericDays,
      }));
    } else if (currentAlarm) {
      setCurrentAlarm({
        ...currentAlarm,
        days: numericDays,
      });
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const isPM = hour >= 12;
    return `${hour % 12 || 12}:${minutes} ${isPM ? 'PM' : 'AM'}`;
  };

  return (
    <div className="container max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Alarms & Check-ins</h2>
        
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Alarm
        </Button>
      </div>
      
      {alarms.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-card">
          <p className="text-muted-foreground mb-4">
            You haven't created any alarms yet. Set up reminders and check-ins to stay on track.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Alarm
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {alarms.map((alarm) => (
            <Card key={alarm.id} className={cn(
              "transition-all",
              alarm.isEnabled ? "opacity-100" : "opacity-50"
            )}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-primary" />
                    <CardTitle>{formatTime(alarm.time)}</CardTitle>
                  </div>
                  <Switch
                    checked={alarm.isEnabled}
                    onCheckedChange={(checked) => handleToggleAlarm(alarm.id, checked)}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="pb-3">
                <p className="text-lg">{alarm.label}</p>
                
                {alarm.isRecurring && alarm.days.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {DAYS.map((day, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                          alarm.days.includes(index)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t pt-3 justify-end">
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setCurrentAlarm(alarm);
                      setIsEditing(true);
                    }}
                  >
                    <SquarePen className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteAlarm(alarm.id)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create alarm dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Alarm</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={newAlarm.time}
                onChange={(e) => setNewAlarm({ ...newAlarm, time: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={newAlarm.label}
                onChange={(e) => setNewAlarm({ ...newAlarm, label: e.target.value })}
                placeholder="e.g., Take medication"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={newAlarm.isRecurring}
                onCheckedChange={(checked) => setNewAlarm({ ...newAlarm, isRecurring: checked })}
              />
              <Label htmlFor="recurring">Recurring</Label>
            </div>
            
            {newAlarm.isRecurring && (
              <div className="space-y-2">
                <Label>Repeat on days</Label>
                <ToggleGroup 
                  type="multiple" 
                  className="justify-between"
                  value={newAlarm.days?.map(d => d.toString()) || []}
                  onValueChange={(value) => handleDayToggle(value, 'new')}
                >
                  {DAYS.map((day, index) => (
                    <ToggleGroupItem key={index} value={index.toString()}>
                      {day}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlarm}>
              Create Alarm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit alarm dialog */}
      <Dialog 
        open={isEditing} 
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
          }
        }}
      >
        {currentAlarm && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Alarm</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={currentAlarm.time}
                  onChange={(e) => setCurrentAlarm({
                    ...currentAlarm,
                    time: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-label">Label</Label>
                <Input
                  id="edit-label"
                  value={currentAlarm.label}
                  onChange={(e) => setCurrentAlarm({
                    ...currentAlarm,
                    label: e.target.value
                  })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-recurring"
                  checked={currentAlarm.isRecurring}
                  onCheckedChange={(checked) => setCurrentAlarm({
                    ...currentAlarm,
                    isRecurring: checked,
                    days: checked ? currentAlarm.days : []
                  })}
                />
                <Label htmlFor="edit-recurring">Recurring</Label>
              </div>
              
              {currentAlarm.isRecurring && (
                <div className="space-y-2">
                  <Label>Repeat on days</Label>
                  <ToggleGroup 
                    type="multiple" 
                    className="justify-between"
                    value={currentAlarm.days.map(d => d.toString())}
                    onValueChange={(value) => handleDayToggle(value, 'current')}
                  >
                    {DAYS.map((day, index) => (
                      <ToggleGroupItem key={index} value={index.toString()}>
                        {day}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAlarm}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}