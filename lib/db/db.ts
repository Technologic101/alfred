"use client";

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface LifelyDB extends DBSchema {
  chats: {
    key: string;
    value: {
      id: string;
      messages: ChatMessage[];
      createdAt: Date;
      updatedAt: Date;
    };
    indexes: { 'by-date': Date };
  };
  journal: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string;
      date: Date;
      tags: string[];
      createdAt: Date;
      updatedAt: Date;
    };
    indexes: { 'by-date': Date };
  };
  habits: {
    key: string;
    value: {
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
    };
  };
  alarms: {
    key: string;
    value: {
      id: string;
      time: string;
      label: string;
      days: number[]; // 0-6, where 0 is Sunday
      isEnabled: boolean;
      isRecurring: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// DB instance
let db: IDBPDatabase<LifelyDB> | null = null;

// Initialize the database
export async function initDb() {
  if (db) return db;
  
  db = await openDB<LifelyDB>('lifely-db', 1, {
    upgrade(db) {
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('chats')) {
        const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
        chatStore.createIndex('by-date', 'updatedAt');
      }
      
      if (!db.objectStoreNames.contains('journal')) {
        const journalStore = db.createObjectStore('journal', { keyPath: 'id' });
        journalStore.createIndex('by-date', 'date');
      }
      
      if (!db.objectStoreNames.contains('habits')) {
        db.createObjectStore('habits', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('alarms')) {
        db.createObjectStore('alarms', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });
  
  return db;
}

// Get the database connection
export async function getDb() {
  if (!db) {
    db = await initDb();
  }
  return db;
}