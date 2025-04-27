"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit2, Trash } from "lucide-react";
import { HabitProgress } from "@/components/habits/habit-progress";
import { v4 as uuidv4 } from "@/lib/utils/uuid";
import { getDb } from "@/lib/db/db";

interface Habit {
  id: string;
  name: string;
  description?: string;
  goal: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  logs: {
    date: Date;
    value: number;
    notes?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export function HabitsPanel() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    name: '',
    description: '',
    goal: 1,
    unit: 'times',
    frequency: 'daily',
  });

  // Load habits from IndexedDB
  useEffect(() => {
    const loadHabits = async () => {
      try {
        const db = await getDb();
        const allHabits = await db.getAll('habits');
        setHabits(allHabits);
      } catch (error) {
        console.error("Error loading habits:", error);
        toast.error("Failed to load habits");
      }
    };
    
    loadHabits();
  }, []);

  const handleCreateHabit = async () => {
    if (!newHabit.name || !newHabit.goal) {
      toast.error("Please enter a name and goal");
      return;
    }
    
    try {
      const habit: Habit = {
        id: uuidv4(),
        name: newHabit.name,
        description: newHabit.description,
        goal: Number(newHabit.goal),
        unit: newHabit.unit || 'times',
        frequency: newHabit.frequency as 'daily' | 'weekly' | 'monthly',
        logs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to database
      const db = await getDb();
      await db.add('habits', habit);
      
      // Update state
      setHabits(prev => [...prev, habit]);
      setNewHabit({
        name: '',
        description: '',
        goal: 1,
        unit: 'times',
        frequency: 'daily',
      });
      setIsCreating(false);
      
      toast.success("Habit created successfully");
    } catch (error) {
      console.error("Error creating habit:", error);
      toast.error("Failed to create habit");
    }
  };

  const handleLogProgress = async (habitId: string, value: number) => {
    try {
      const db = await getDb();
      const habit = await db.get('habits', habitId);
      
      if (habit) {
        const log = {
          date: new Date(),
          value,
          notes: '',
        };
        
        habit.logs.push(log);
        habit.updatedAt = new Date();
        
        await db.put('habits', habit);
        
        // Update state
        setHabits(prev => 
          prev.map(h => 
            h.id === habitId 
              ? { ...h, logs: [...h.logs, log], updatedAt: new Date() }
              : h
          )
        );
        
        toast.success("Progress logged");
      }
    } catch (error) {
      console.error("Error logging progress:", error);
      toast.error("Failed to log progress");
    }
  };

  return (
    <div className="container max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Habit Tracker</h2>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Habit
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Habit Name</Label>
                <Input
                  id="name"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="e.g., Drink Water"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  placeholder="e.g., Stay hydrated throughout the day"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal">Goal</Label>
                  <Input
                    id="goal"
                    type="number"
                    min="1"
                    value={newHabit.goal}
                    onChange={(e) => setNewHabit({ ...newHabit, goal: Number(e.target.value) })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={newHabit.unit}
                    onChange={(e) => setNewHabit({ ...newHabit, unit: e.target.value })}
                    placeholder="e.g., glasses, minutes"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newHabit.frequency}
                  onValueChange={(value) => setNewHabit({ ...newHabit, frequency: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateHabit}>
                Create Habit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {habits.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-card">
          <p className="text-muted-foreground mb-4">
            You haven't created any habits yet. Start tracking your progress by creating your first habit.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Habit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {habits.map((habit) => (
            <Card key={habit.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{habit.name}</CardTitle>
                {habit.description && (
                  <p className="text-sm text-muted-foreground">{habit.description}</p>
                )}
              </CardHeader>
              
              <CardContent>
                <HabitProgress habit={habit} />
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-4 mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1"
                  onClick={() => handleLogProgress(habit.id, 1)}
                >
                  <Plus className="h-4 w-4" />
                  Log Progress
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}