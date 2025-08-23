"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Mail, Phone, Search, Shield, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

const API_BASE_URL = "http://127.0.0.1:8000"

// Helper function to format timestamps
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return `${days} days ago`;
};

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  
  // --- State for API data ---
  const [notificationsData, setNotificationsData] = useState([])
  const [filteredNotifications, setFilteredNotifications] = useState([])

  // --- Fetch data from the backend ---
  const fetchNotifications = useCallback(async () => {
    try {
      // --- CHANGE HERE: Updated to the correct endpoint ---
      const response = await fetch(`${API_BASE_URL}/api/attack-logs`);
      const data = await response.json();
      setNotificationsData(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Auto-refresh
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // --- Client-side filtering logic ---
  useEffect(() => {
    let data = notificationsData;

    if (searchQuery) {
        data = data.filter(notification =>
            notification.source_ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notification.details.type?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (activeTab === "blocked") {
        data = data.filter(n => n.details.type); // Filter for actual attacks
    } else if (activeTab === "call-failed") {
        data = data.filter(n => n.call_status === "failed");
    }
    // "Flagged" is a conceptual status not yet implemented in the backend data
    
    setFilteredNotifications(data);
  }, [searchQuery, activeTab, notificationsData]);

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
                <TabsTrigger value="flagged" disabled>Flagged</TabsTrigger>
                <TabsTrigger value="call-failed">Call Failed</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by IP or Attack Type..."
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
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                        <h3 className="font-medium">Attack Detected: {notification.details.type}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.timestamp)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Confirmed attack from IP address {notification.source_ip}. The IP has been blacklisted.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="font-mono">
                        IP: {notification.source_ip}
                      </Badge>
                      {notification.email_status !== 'pending' && (
                        <Badge variant="outline" className={notification.email_status === "success" ? "bg-primary/10" : "bg-destructive/10"}>
                          <Mail className="mr-1 h-3 w-3" />
                          Email {notification.email_status}
                        </Badge>
                      )}
                      {notification.call_status !== 'pending' && (
                        <Badge
                          variant="outline"
                          className={notification.call_status === "success" ? "bg-green-500/10" : "bg-destructive/10"}
                        >
                          <Phone className="mr-1 h-3 w-3" />
                          Call {notification.call_status}
                        </Badge>
                      )}
                       <Badge variant="destructive">
                         <ShieldAlert className="mr-1 h-3 w-3" />
                         Blocked
                       </Badge>
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
