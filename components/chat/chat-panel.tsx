"use client";

import { useState, useRef, useEffect } from "react";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw } from "lucide-react";
import { v4 as uuidv4 } from "@/lib/utils/uuid";
import { getDb, ChatMessage } from "@/lib/db/db";
import { sendMCPRequest } from "@/lib/ai/mcp";
import { toast } from "sonner";

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export function ChatPanel() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from IndexedDB
  useEffect(() => {
    const loadChatSessions = async () => {
      try {
        const db = await getDb();
        const allSessions = await db.getAll('chats');
        
        // Sort by updatedAt date
        allSessions.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        setChatSessions(allSessions);
        
        // If there are sessions, set the most recent as current
        if (allSessions.length > 0) {
          setCurrentSession(allSessions[0].id);
          setMessages(allSessions[0].messages);
        } else {
          // Create a new session if none exist
          createNewSession();
        }
      } catch (error) {
        console.error("Error loading chat sessions:", error);
        toast.error("Failed to load chat history");
      }
    };
    
    loadChatSessions();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createNewSession = async () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      const db = await getDb();
      await db.add('chats', newSession);
      
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error("Error creating new chat session:", error);
      toast.error("Failed to create new chat");
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !currentSession) return;
    
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsProcessing(true);
    
    try {
      // Send to MCP
      const mcpResponse = await sendMCPRequest({
        query: content,
        context: {
          chatHistory: updatedMessages
        },
        functions: [
          {
            name: "set_alarm",
            description: "Set an alarm or reminder for a specific time",
            parameters: {
              time: {
                type: "string",
                description: "The time for the alarm in HH:MM format"
              },
              label: {
                type: "string",
                description: "The label for the alarm"
              },
              recurring: {
                type: "boolean",
                description: "Whether the alarm is recurring"
              }
            }
          },
          {
            name: "track_habit",
            description: "Track progress for a habit",
            parameters: {
              habitName: {
                type: "string",
                description: "The name of the habit to track"
              },
              value: {
                type: "number",
                description: "The value to log for the habit"
              }
            }
          }
        ]
      });
      
      // Handle any function calls
      if (mcpResponse.functionCalls && mcpResponse.functionCalls.length > 0) {
        for (const call of mcpResponse.functionCalls) {
          if (call.name === "set_alarm") {
            toast.success(`Creating alarm: ${call.arguments.label} at ${call.arguments.time}`);
            // In a real app, we would actually create the alarm here
          } else if (call.name === "track_habit") {
            toast.success(`Tracking habit: ${call.arguments.habitName}`);
            // In a real app, we would actually log the habit here
          }
        }
      }
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: mcpResponse.response,
        timestamp: new Date()
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Save to database
      const db = await getDb();
      const session = await db.get('chats', currentSession);
      
      if (session) {
        session.messages = finalMessages;
        session.updatedAt = new Date();
        await db.put('chats', session);
        
        // Update chat sessions list
        setChatSessions(prev => 
          prev.map(s => 
            s.id === currentSession 
              ? { ...s, messages: finalMessages, updatedAt: new Date() }
              : s
          ).sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error("Failed to process your message");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex justify-end gap-2 mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={createNewSession}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Chat
        </Button>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 rounded-lg border bg-card mb-4"
      >
        <ChatList messages={messages} />
      </div>
      
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isProcessing={isProcessing}
      />
    </div>
  );
}