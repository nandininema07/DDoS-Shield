"use client"

import { useState } from "react"
import { Bell, Mail, Phone, Search, Shield, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

// Sample notifications data
const notificationsData = [
  {
    id: 1,
    title: "DDoS Attack Blocked",
    description: "High volume of traffic from multiple IPs detected and blocked.",
    time: "10 minutes ago",
    type: "blocked",
    ipAddress: "192.168.1.45",
    emailSent: true,
    callMade: true,
    callStatus: "success",
  },
  {
    id: 2,
    title: "IP Address Blocked",
    description: "IP 203.45.67.89 has been automatically blocked due to suspicious activity.",
    time: "25 minutes ago",
    type: "blocked",
    ipAddress: "203.45.67.89",
    emailSent: true,
    callMade: true,
    callStatus: "failed",
  },
  {
    id: 3,
    title: "System Update",
    description: "ML model has been updated to the latest version.",
    time: "1 hour ago",
    type: "system",
    ipAddress: null,
    emailSent: false,
    callMade: false,
    callStatus: null,
  },
  {
    id: 4,
    title: "New IP Flagged",
    description: "IP 78.90.12.34 has been flagged for monitoring.",
    time: "2 hours ago",
    type: "flagged",
    ipAddress: "78.90.12.34",
    emailSent: true,
    callMade: false,
    callStatus: null,
  },
  {
    id: 5,
    title: "Traffic Spike Detected",
    description: "Unusual traffic spike detected but determined to be legitimate traffic.",
    time: "3 hours ago",
    type: "alert",
    ipAddress: null,
    emailSent: true,
    callMade: false,
    callStatus: null,
  },
  {
    id: 6,
    title: "IP Address Blocked",
    description: "IP 112.34.56.78 has been automatically blocked due to DNS Amplification attack.",
    time: "5 hours ago",
    type: "blocked",
    ipAddress: "112.34.56.78",
    emailSent: true,
    callMade: true,
    callStatus: "success",
  },
  {
    id: 7,
    title: "New IP Flagged",
    description: "IP 45.67.123.45 has been flagged for monitoring.",
    time: "8 hours ago",
    type: "flagged",
    ipAddress: "45.67.123.45",
    emailSent: true,
    callMade: false,
    callStatus: null,
  },
  {
    id: 8,
    title: "System Maintenance",
    description: "Scheduled system maintenance completed successfully.",
    time: "12 hours ago",
    type: "system",
    ipAddress: null,
    emailSent: false,
    callMade: false,
    callStatus: null,
  },
]

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const filteredNotifications = notificationsData.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (notification.ipAddress && notification.ipAddress.includes(searchQuery))

    if (activeTab === "all") return matchesSearch
    if (activeTab === "blocked") return matchesSearch && notification.type === "blocked"
    if (activeTab === "flagged") return matchesSearch && notification.type === "flagged"
    if (activeTab === "call-failed") return matchesSearch && notification.callStatus === "failed"

    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">View all system notifications and alerts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Center
          </CardTitle>
          <CardDescription>Stay updated with all system activities and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="blocked">Blocked</TabsTrigger>
                <TabsTrigger value="flagged">Flagged</TabsTrigger>
                <TabsTrigger value="call-failed">Call Failed</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notifications..."
                className="w-full pl-9 sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
            <div className="mt-6 space-y-6">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div key={notification.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {notification.type === "blocked" && <ShieldAlert className="h-5 w-5 text-destructive" />}
                        {notification.type === "flagged" && <Shield className="h-5 w-5 text-amber-500" />}
                        {notification.type === "system" && <Bell className="h-5 w-5 text-primary" />}
                        {notification.type === "alert" && <Bell className="h-5 w-5 text-amber-500" />}
                        <h3 className="font-medium">{notification.title}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {notification.ipAddress && (
                        <Badge variant="outline" className="font-mono">
                          IP: {notification.ipAddress}
                        </Badge>
                      )}
                      {notification.emailSent && (
                        <Badge variant="outline" className="bg-primary/10">
                          <Mail className="mr-1 h-3 w-3" />
                          Email Sent
                        </Badge>
                      )}
                      {notification.callMade && (
                        <Badge
                          variant="outline"
                          className={notification.callStatus === "success" ? "bg-green-500/10" : "bg-destructive/10"}
                        >
                          <Phone className="mr-1 h-3 w-3" />
                          Call {notification.callStatus === "success" ? "Successful" : "Failed"}
                        </Badge>
                      )}
                      {notification.type === "blocked" && (
                        <Badge variant="destructive">
                          <ShieldAlert className="mr-1 h-3 w-3" />
                          Blocked
                        </Badge>
                      )}
                      {notification.type === "flagged" && (
                        <Badge>
                          <Shield className="mr-1 h-3 w-3" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))
              ) : (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                  <div className="text-center">
                    <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No notifications found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "Try a different search term" : "You're all caught up!"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
