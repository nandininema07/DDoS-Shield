"use client"

import { useState } from "react"
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

// Sample data for charts
const trafficData = [
  { time: "00:00", traffic: 2100, attacks: 0 },
  { time: "02:00", traffic: 1800, attacks: 0 },
  { time: "04:00", traffic: 1500, attacks: 0 },
  { time: "06:00", traffic: 2000, attacks: 0 },
  { time: "08:00", traffic: 3500, attacks: 0 },
  { time: "10:00", traffic: 5200, attacks: 150 },
  { time: "12:00", traffic: 6000, attacks: 320 },
  { time: "14:00", traffic: 5800, attacks: 80 },
  { time: "16:00", traffic: 5500, attacks: 0 },
  { time: "18:00", traffic: 4800, attacks: 0 },
  { time: "20:00", traffic: 4200, attacks: 200 },
  { time: "22:00", traffic: 3000, attacks: 0 },
]

// Sample data for notifications
const notifications = [
  {
    id: 1,
    title: "DDoS Attack Detected",
    description: "High volume of traffic from multiple IPs detected and blocked.",
    time: "10 minutes ago",
    severity: "high",
  },
  {
    id: 2,
    title: "IP Address Blocked",
    description: "IP 192.168.1.45 has been automatically blocked due to suspicious activity.",
    time: "25 minutes ago",
    severity: "medium",
  },
  {
    id: 3,
    title: "System Update",
    description: "ML model has been updated to the latest version.",
    time: "1 hour ago",
    severity: "low",
  },
  {
    id: 4,
    title: "New IP Flagged",
    description: "IP 203.45.67.89 has been flagged for monitoring.",
    time: "2 hours ago",
    severity: "medium",
  },
]

export default function DashboardPage() {
  const [protectionEnabled, setProtectionEnabled] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
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
            <div className="text-2xl font-bold">750</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">+5 in the last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">-2 from yesterday</p>
          </CardContent>
        </Card>
      </div>

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
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
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
                      name="Traffic (requests/min)"
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
              <CardDescription>Types of attacks detected in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "SYN Flood", value: 320 },
                      { name: "UDP Flood", value: 210 },
                      { name: "HTTP Flood", value: 170 },
                      { name: "DNS Amplification", value: 50 },
                    ]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
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

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Recent Notifications</h2>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Alert
              key={notification.id}
              variant={
                notification.severity === "high"
                  ? "destructive"
                  : notification.severity === "medium"
                    ? "default"
                    : "outline"
              }
            >
              <div className="flex items-start">
                {notification.severity === "high" ? (
                  <ShieldAlert className="h-4 w-4" />
                ) : notification.severity === "medium" ? (
                  <Shield className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <div className="ml-4 flex-1">
                  <AlertTitle className="flex items-center justify-between">
                    {notification.title}
                    <span className="text-xs font-normal text-muted-foreground">{notification.time}</span>
                  </AlertTitle>
                  <AlertDescription>{notification.description}</AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </div>
    </div>
  )
}
