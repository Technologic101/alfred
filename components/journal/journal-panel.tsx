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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Edit2, Plus, Calendar, Tag, Search } from "lucide-react";
import { format } from "date-fns";
import { v4 as uuidv4 } from "@/lib/utils/uuid";
import { getDb } from "@/lib/db/db";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export function JournalPanel() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({
    title: '',
    content: '',
    date: new Date(),
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  // Load journal entries from IndexedDB
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const db = await getDb();
        const allEntries = await db.getAll('journal');
        
        // Sort by date (newest first)
        allEntries.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setEntries(allEntries);
      } catch (error) {
        console.error("Error loading journal entries:", error);
        toast.error("Failed to load journal entries");
      }
    };
    
    loadEntries();
  }, []);

  const handleCreateEntry = async () => {
    if (!newEntry.title || !newEntry.content) {
      toast.error("Please enter a title and content");
      return;
    }
    
    try {
      const entry: JournalEntry = {
        id: uuidv4(),
        title: newEntry.title,
        content: newEntry.content,
        date: newEntry.date || new Date(),
        tags: newEntry.tags || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save to database
      const db = await getDb();
      await db.add('journal', entry);
      
      // Update state
      setEntries(prev => [entry, ...prev]);
      setNewEntry({
        title: '',
        content: '',
        date: new Date(),
        tags: [],
      });
      setIsCreating(false);
      
      toast.success("Journal entry created");
    } catch (error) {
      console.error("Error creating journal entry:", error);
      toast.error("Failed to create journal entry");
    }
  };

  const handleUpdateEntry = async () => {
    if (!currentEntry || !currentEntry.title || !currentEntry.content) return;
    
    try {
      const updatedEntry = {
        ...currentEntry,
        updatedAt: new Date()
      };
      
      // Save to database
      const db = await getDb();
      await db.put('journal', updatedEntry);
      
      // Update state
      setEntries(prev => 
        prev.map(entry => 
          entry.id === updatedEntry.id ? updatedEntry : entry
        )
      );
      
      setIsEditing(false);
      toast.success("Journal entry updated");
    } catch (error) {
      console.error("Error updating journal entry:", error);
      toast.error("Failed to update journal entry");
    }
  };

  const handleViewEntry = (entry: JournalEntry) => {
    setCurrentEntry(entry);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setIsEditing(true);
  };

  const handleAddTag = (entryState: 'new' | 'current') => {
    if (!tagInput.trim()) return;
    
    if (entryState === 'new') {
      setNewEntry(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
    } else if (currentEntry) {
      setCurrentEntry({
        ...currentEntry,
        tags: [...currentEntry.tags, tagInput.trim()]
      });
    }
    
    setTagInput("");
  };

  const handleRemoveTag = (tag: string, entryState: 'new' | 'current') => {
    if (entryState === 'new') {
      setNewEntry(prev => ({
        ...prev,
        tags: (prev.tags || []).filter(t => t !== tag)
      }));
    } else if (currentEntry) {
      setCurrentEntry({
        ...currentEntry,
        tags: currentEntry.tags.filter(t => t !== tag)
      });
    }
  };

  return (
    <div className="container max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Journal</h2>
        
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>
      
      {/* Journal entries list */}
      {entries.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-card">
          <p className="text-muted-foreground mb-4">
            You haven't created any journal entries yet. Start journaling by creating your first entry.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Entry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden cursor-pointer" onClick={() => handleViewEntry(entry)}>
              <CardHeader className="pb-2">
                <CardTitle>{entry.title}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="line-clamp-3 text-sm">
                  {entry.content}
                </p>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="bg-muted text-xs rounded-full px-2 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t pt-3 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditEntry(entry);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create entry dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="Give your entry a title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                placeholder="What's on your mind today?"
                className="min-h-[200px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {(newEntry.tags || []).map((tag) => (
                  <span 
                    key={tag} 
                    className="bg-muted rounded-full px-2.5 py-1 text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag, 'new')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag('new');
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => handleAddTag('new')}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEntry}>
              Save Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View entry dialog */}
      <Dialog 
        open={currentEntry !== null && !isEditing} 
        onOpenChange={(open) => !open && setCurrentEntry(null)}
      >
        {currentEntry && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{currentEntry.title}</DialogTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                {format(new Date(currentEntry.date), 'MMMM d, yyyy')}
              </div>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-4">
                <p className="whitespace-pre-wrap">{currentEntry.content}</p>
                
                {currentEntry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t">
                    <span className="flex items-center text-sm text-muted-foreground mr-2">
                      <Tag className="h-3.5 w-3.5 mr-1" />
                      Tags:
                    </span>
                    {currentEntry.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="bg-muted text-sm rounded-full px-2.5 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCurrentEntry(null)}>
                Close
              </Button>
              <Button onClick={() => handleEditEntry(currentEntry)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Edit entry dialog */}
      <Dialog 
        open={isEditing} 
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
          }
        }}
      >
        {currentEntry && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Journal Entry</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={currentEntry.title}
                  onChange={(e) => setCurrentEntry({
                    ...currentEntry,
                    title: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={currentEntry.content}
                  onChange={(e) => setCurrentEntry({
                    ...currentEntry,
                    content: e.target.value
                  })}
                  className="min-h-[200px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {currentEntry.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="bg-muted rounded-full px-2.5 py-1 text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag, 'current')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag('current');
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleAddTag('current')}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateEntry}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}