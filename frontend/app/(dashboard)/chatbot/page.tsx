"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowUp, Mic, MicOff, Phone, PhoneOff, Shield, ShieldAlert, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

// Sample chat messages
const initialMessages = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm your DDoS Protection Assistant. How can I help you today?",
    timestamp: "10:00 AM",
  },
]

// Sample recent actions
const recentActions = [
  {
    id: 1,
    type: "blocked",
    ipAddress: "192.168.1.45",
    time: "10:23 AM",
    reason: "SYN Flood Attack",
    details: "Blocked IP after detecting high volume of SYN packets",
  },
  {
    id: 2,
    type: "flagged",
    ipAddress: "203.45.67.89",
    time: "09:15 AM",
    reason: "Suspicious HTTP Requests",
    details: "Flagged for monitoring due to unusual request patterns",
  },
  {
    id: 3,
    type: "blocked",
    ipAddress: "78.90.12.34",
    time: "07:30 AM",
    reason: "UDP Flood Attack",
    details: "Blocked IP after detecting UDP flood attack",
  },
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Simulate assistant response after a short delay
    setTimeout(() => {
      const assistantMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: getAssistantResponse(input),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  const getAssistantResponse = (userInput: string) => {
    const input = userInput.toLowerCase()

    if (input.includes("attack") || input.includes("ddos")) {
      return "I've analyzed your recent traffic patterns and detected 3 potential DDoS attacks in the last 24 hours. All attacks were automatically blocked by the system. Would you like to see more details about these incidents?"
    } else if (input.includes("ip") || input.includes("block")) {
      return "Currently, there are 128 IP addresses on your blacklist. 5 new IPs were added in the last 24 hours. You can view and manage all blocked IPs in the Blacklist section."
    } else if (input.includes("status") || input.includes("traffic")) {
      return "Your current network status is normal. Traffic levels are within expected ranges, and no unusual patterns have been detected in the last hour. The system is actively monitoring for potential threats."
    } else if (input.includes("help") || input.includes("how")) {
      return "I can help you monitor your network security, analyze traffic patterns, and manage blocked IPs. You can ask me about recent attacks, current traffic status, or how to configure your protection settings. What would you like to know?"
    } else {
      return "I'm here to help with your DDoS protection needs. You can ask me about recent attacks, current traffic status, blocked IPs, or how to configure your protection settings. How can I assist you today?"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)

    if (!isRecording) {
      toast({
        title: "Voice recognition activated",
        description: "Speak now to interact with the assistant",
      })
    } else {
      toast({
        title: "Voice recognition deactivated",
        description: "Voice input has been turned off",
      })
    }
  }

  const toggleCall = () => {
    setIsCallActive(!isCallActive)

    if (!isCallActive) {
      toast({
        title: "Call initiated",
        description: "Connected to DDoS Protection support",
      })
    } else {
      toast({
        title: "Call ended",
        description: "Disconnected from DDoS Protection support",
      })
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
                    <div className="flex gap-3">
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
                          <p>{message.content}</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{message.timestamp}</p>
                      </div>
                      {message.role === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="mt-4 flex gap-2">
              <div className="flex gap-2">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleRecording}
                  title={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  <span className="sr-only">{isRecording ? "Stop recording" : "Start recording"}</span>
                </Button>
                <Button
                  variant={isCallActive ? "destructive" : "outline"}
                  size="icon"
                  onClick={toggleCall}
                  title={isCallActive ? "End call" : "Start call"}
                >
                  {isCallActive ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  <span className="sr-only">{isCallActive ? "End call" : "Start call"}</span>
                </Button>
              </div>
              <div className="relative flex-1">
                <Input
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-10"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={handleSendMessage}
                  disabled={!input.trim()}
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
                {recentActions.map((action) => (
                  <div key={action.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={action.type === "blocked" ? "destructive" : "default"}>
                        {action.type === "blocked" ? (
                          <ShieldAlert className="mr-1 h-3 w-3" />
                        ) : (
                          <Shield className="mr-1 h-3 w-3" />
                        )}
                        {action.type === "blocked" ? "Blocked" : "Flagged"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{action.time}</span>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="font-mono text-sm">{action.ipAddress}</div>
                      <div className="mt-1 text-sm font-medium">{action.reason}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{action.details}</div>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
