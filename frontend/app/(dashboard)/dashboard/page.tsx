"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle, Clock, RefreshCw, Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"

// --- Base URL for your backend API ---
const API_BASE_URL = "http://127.0.0.1:8000"

// --- NEW: Helper function to format timestamps into a "time ago" format ---
const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};


export default function DashboardPage() {
  const [protectionEnabled, setProtectionEnabled] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // --- State to hold data from the API ---
  const [stats, setStats] = useState({
    total_detected_attacks: 0,
    blocked_ips: 0,
    active_threats: 0,
  })
  const [trafficData, setTrafficData] = useState([])
  const [attackDistribution, setAttackDistribution] = useState([])
  const [notifications, setNotifications] = useState([])

  // --- Function to fetch all dashboard data ---
  const fetchData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Fetch all data in parallel for better performance
      const [statsRes, trafficRes, distributionRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard-stats`),
        fetch(`${API_BASE_URL}/api/traffic-chart-data`),
        fetch(`${API_BASE_URL}/api/attack-distribution-chart`),
        fetch(`${API_BASE_URL}/api/attack-logs`), // This endpoint now returns unique logs
      ])

      // Parse JSON responses
      const statsData = await statsRes.json()
      const trafficData = await trafficRes.json()
      const distributionData = await distributionRes.json()
      const logsData = await logsRes.json()

      // Update state
      setStats(statsData)
      setTrafficData(trafficData)
      setAttackDistribution(distributionData)
      
      // --- CHANGE: Transform unique attack logs into the notification format ---
      const formattedNotifications = logsData.map((log, index) => ({
        id: log.id || index + 1,
        title: `Attack from ${log.source_ip}`,
        description: `Detected a ${log.details.type || 'high-volume'} attack. The IP has been blocked.`,
        // --- CHANGE: Use the new formatTimeAgo function for a user-friendly display ---
        time: formatTimeAgo(log.timestamp),
        severity: "high",
      }));
      setNotifications(formattedNotifications)

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // --- Fetch data on component mount and set up auto-refresh ---
  useEffect(() => {
    fetchData()
    // --- NEW: Add a timer to automatically refresh data every 30 seconds ---
    const interval = setInterval(fetchData, 30000);
    // Cleanup the interval when the component unmounts to prevent memory leaks
    return () => clearInterval(interval);
  }, [fetchData])

  const handleRefresh = () => {
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Header and Stat Cards are now populated from the 'stats' state */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your DDoS protection system</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="protection-mode" checked={protectionEnabled} onCheckedChange={setProtectionEnabled} />
            <Label htmlFor="protection-mode">Protection {protectionEnabled ? "Enabled" : "Disabled"}</Label>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh data</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Detected Attacks</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_detected_attacks}</div>
            <p className="text-xs text-muted-foreground">Across all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blocked_ips}</div>
            <p className="text-xs text-muted-foreground">Total unique IPs blacklisted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_threats}</div>
            <p className="text-xs text-muted-foreground">In the last 5 minutes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts are now populated from 'trafficData' and 'attackDistribution' states */}
      <Tabs defaultValue="traffic">
        <TabsList>
          <TabsTrigger value="traffic">Traffic Overview</TabsTrigger>
          <TabsTrigger value="attacks">Attack Distribution</TabsTrigger>
        </TabsList>
        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Traffic</CardTitle>
              <CardDescription>24-hour traffic pattern with attack indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trafficData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="traffic"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                      name="Simulated Total Traffic"
                    />
                    <Area
                      type="monotone"
                      dataKey="attacks"
                      stroke="#ff0000"
                      fill="#ff0000"
                      fillOpacity={0.3}
                      name="Attack Traffic"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="attacks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attack Distribution</CardTitle>
              <CardDescription>Types of attacks detected across all time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attackDistribution}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Number of Attacks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notifications are now populated from the 'notifications' state */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Recent Notifications</h2>
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <Alert
                key={notification.id}
                variant={"destructive"}
              >
                <div className="flex items-start">
                  <ShieldAlert className="h-4 w-4" />
                  <div className="ml-4 flex-1">
                    <AlertTitle className="flex items-center justify-between">
                      {notification.title}
                      <span className="text-xs font-normal text-muted-foreground">{notification.time}</span>
                    </AlertTitle>
                    <AlertDescription>{notification.description}</AlertDescription>
                  </div>
                </div>
              </Alert>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent notifications.</p>
          )}
        </div>
      </div>
    </div>
  )
}
