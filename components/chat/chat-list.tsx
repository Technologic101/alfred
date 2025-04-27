"use client";

import { ChatMessage } from "@/lib/db/db";
import { Avatar } from "@/components/ui/avatar";
import { VoicePlayer } from "@/components/voice/voice-player";
import { User, Bot } from "lucide-react";
import { format } from "date-fns";

interface ChatListProps {
  messages: ChatMessage[];
}

export function ChatList({ messages }: ChatListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
        <Bot className="h-12 w-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Your Life Assistant</h3>
        <p className="max-w-md">
          Ask me anything about your life, goals, habits, or daily tasks. 
          I can help you stay organized, motivated, and on track.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.role === 'assistant' && (
            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </Avatar>
          )}
          
          <div className="flex flex-col max-w-[80%]">
            <div
              className={`rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <span>{format(new Date(message.timestamp), 'h:mm a')}</span>
              
              {message.role === 'assistant' && (
                <VoicePlayer text={message.content} />
              )}
            </div>
          </div>
          
          {message.role === 'user' && (
            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
              <User className="h-5 w-5" />
            </Avatar>
          )}
        </div>
      ))}
    </div>
  );
}