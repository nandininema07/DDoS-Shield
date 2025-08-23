"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { ArrowUp, Mic, MicOff, Phone, PhoneOff, Shield, ShieldAlert, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

// --- Base URL for your backend API ---
const API_BASE_URL = "http://127.0.0.1:8000"

// --- Helper function to format timestamps ---
const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [recentActions, setRecentActions] = useState([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // --- Fetch Recent Actions from the backend ---
  const fetchRecentActions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/attack-logs`);
      const data = await response.json();
      setRecentActions(data);
    } catch (error) {
      console.error("Failed to fetch recent actions:", error);
    }
  }, []);

  // --- NEW: Fetch chat history from the backend ---
  const fetchChatHistory = useCallback(async () => {
      try {
          const response = await fetch(`${API_BASE_URL}/api/chat-history`);
          const data = await response.json();
          if (data.length === 0) {
              // If no history, add the initial greeting
              setMessages([{
                  id: 1,
                  role: "assistant",
                  content: "Hello! I'm your DDoS Protection Assistant. How can I help you today?",
                  timestamp: new Date(),
              }]);
          } else {
              setMessages(data);
          }
      } catch (error) {
          console.error("Failed to fetch chat history:", error);
      }
  }, []);

  useEffect(() => {
    fetchRecentActions();
    fetchChatHistory();
  }, [fetchRecentActions, fetchChatHistory]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true);
    const currentInput = input;
    setInput("");

    // --- Add user message optimistically for better UX ---
    const userMessage = {
      id: Date.now(), // Use a temporary ID
      role: "user",
      content: currentInput,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage]);

    // --- Call the real chatbot API ---
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentInput }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      // --- Re-fetch history to get both user and assistant messages from DB ---
      await fetchChatHistory();

    } catch (error) {
      console.error("Failed to get chatbot response:", error);
      // You can add an error message to the chat here if desired
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card className="h-[calc(100vh-8rem)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              DDoS Protection Assistant
            </CardTitle>
            <CardDescription>Ask questions about your network security and DDoS protection</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[calc(100%-8rem)] flex-col">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="flex max-w-[80%] gap-3">
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Assistant" />
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <Avatar className="h-8 w-8">
                           <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                           <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                   <div className="flex justify-start">
                     <div className="flex gap-3">
                       <Avatar className="h-8 w-8">
                         <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Assistant" />
                         <AvatarFallback>AI</AvatarFallback>
                       </Avatar>
                       <div className="rounded-lg bg-muted px-4 py-2">
                         <p>Thinking...</p>
                       </div>
                     </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card className="h-[calc(100vh-8rem)]">
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>System actions taken to protect your network</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
              <div className="space-y-4">
                {recentActions.length > 0 ? (
                  recentActions.map((action) => (
                    <div key={action.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="destructive">
                          <ShieldAlert className="mr-1 h-3 w-3" />
                          Blocked
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(action.timestamp)}</span>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="font-mono text-sm">{action.source_ip}</div>
                        <div className="mt-1 text-sm font-medium">{action.details.type || 'High-Volume Attack'}</div>
                        <div className="mt-1 text-xs text-muted-foreground">Blocked after detecting malicious flow patterns.</div>
                      </div>
                      <Separator />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent actions recorded.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
