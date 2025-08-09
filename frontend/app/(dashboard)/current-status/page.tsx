"use client"

import { useState } from "react"
import { AlertCircle, Check, Info, Search, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

// Sample data for the live chart
const liveData = [
  { time: "00:00", traffic: 2100, threshold: 4000 },
  { time: "02:00", traffic: 1800, threshold: 4000 },
  { time: "04:00", traffic: 1500, threshold: 4000 },
  { time: "06:00", traffic: 2000, threshold: 4000 },
  { time: "08:00", traffic: 3500, threshold: 4000 },
  { time: "10:00", traffic: 5200, threshold: 4000 },
  { time: "12:00", traffic: 4000, threshold: 4000 },
  { time: "14:00", traffic: 3800, threshold: 4000 },
  { time: "16:00", traffic: 3500, threshold: 4000 },
  { time: "18:00", traffic: 4800, threshold: 4000 },
  { time: "20:00", traffic: 4200, threshold: 4000 },
  { time: "22:00", traffic: 3000, threshold: 4000 },
  { time: "23:59", traffic: 2800, threshold: 4000 },
]

// Sample data for the log table
const logData = [
  {
    id: 1,
    ipAddress: "192.168.1.45",
    date: "2023-04-09",
    time: "10:23:45",
    status: "DDoS Detected",
    details: {
      confidence: 0.95,
      packetRate: "12,500/sec",
      trafficVolume: "1.2 GB/min",
      attackType: "SYN Flood",
      sourceCountry: "Unknown",
      actionTaken: "Blocked",
    },
  },
  {
    id: 2,
    ipAddress: "203.45.67.89",
    date: "2023-04-09",
    time: "09:15:30",
    status: "Flagged",
    details: {
      confidence: 0.75,
      packetRate: "8,200/sec",
      trafficVolume: "750 MB/min",
      attackType: "HTTP Flood",
      sourceCountry: "Russia",
      actionTaken: "Monitoring",
    },
  },
  {
    id: 3,
    ipAddress: "45.67.89.123",
    date: "2023-04-09",
    time: "08:45:12",
    status: "Safe",
    details: {
      confidence: 0.15,
      packetRate: "1,200/sec",
      trafficVolume: "120 MB/min",
      attackType: "N/A",
      sourceCountry: "United States",
      actionTaken: "None",
    },
  },
  {
    id: 4,
    ipAddress: "78.90.12.34",
    date: "2023-04-09",
    time: "07:30:55",
    status: "DDoS Detected",
    details: {
      confidence: 0.92,
      packetRate: "15,800/sec",
      trafficVolume: "1.8 GB/min",
      attackType: "UDP Flood",
      sourceCountry: "China",
      actionTaken: "Blocked",
    },
  },
  {
    id: 5,
    ipAddress: "112.34.56.78",
    date: "2023-04-09",
    time: "06:20:10",
    status: "Flagged",
    details: {
      confidence: 0.68,
      packetRate: "5,600/sec",
      trafficVolume: "480 MB/min",
      attackType: "DNS Amplification",
      sourceCountry: "Brazil",
      actionTaken: "Monitoring",
    },
  },
  {
    id: 6,
    ipAddress: "89.123.45.67",
    date: "2023-04-09",
    time: "05:10:30",
    status: "Safe",
    details: {
      confidence: 0.08,
      packetRate: "950/sec",
      trafficVolume: "85 MB/min",
      attackType: "N/A",
      sourceCountry: "Germany",
      actionTaken: "None",
    },
  },
]

export default function CurrentStatusPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<(typeof logData)[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredLogs = logData.filter((log) => {
    const matchesSearch = log.ipAddress.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || log.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const handleViewDetails = (log: (typeof logData)[0]) => {
    setSelectedLog(log)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Current Status</h1>
        <p className="text-muted-foreground">Monitor real-time network activity and traffic logs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Network Activity</CardTitle>
          <CardDescription>Current traffic patterns with DDoS threshold indicator</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={liveData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="traffic"
                  stroke="#8884d8"
                  name="Current Traffic (requests/min)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="#ff0000"
                  strokeDasharray="5 5"
                  name="DDoS Threshold"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold">Traffic Log</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by IP..."
                className="w-full pl-9 sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ddos detected">DDoS Detected</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono">{log.ipAddress}</TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>{log.time}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "DDoS Detected"
                            ? "destructive"
                            : log.status === "Flagged"
                              ? "default"
                              : "outline"
                        }
                      >
                        {log.status === "DDoS Detected" && <ShieldAlert className="mr-1 h-3 w-3" />}
                        {log.status === "Flagged" && <AlertCircle className="mr-1 h-3 w-3" />}
                        {log.status === "Safe" && <Check className="mr-1 h-3 w-3" />}
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(log)}>
                        <Info className="mr-1 h-4 w-4" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedLog && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>IP Details: {selectedLog.ipAddress}</DialogTitle>
              <DialogDescription>Detailed information about this traffic log</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between rounded-lg bg-muted p-3">
                <div className="font-medium">Status</div>
                <Badge
                  variant={
                    selectedLog.status === "DDoS Detected"
                      ? "destructive"
                      : selectedLog.status === "Flagged"
                        ? "default"
                        : "outline"
                  }
                >
                  {selectedLog.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">ML Model Analysis</div>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className="text-sm font-medium text-right">
                    {(selectedLog.details.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Packet Rate</div>
                  <div className="text-sm font-medium text-right">{selectedLog.details.packetRate}</div>
                  <div className="text-sm text-muted-foreground">Traffic Volume</div>
                  <div className="text-sm font-medium text-right">{selectedLog.details.trafficVolume}</div>
                  <div className="text-sm text-muted-foreground">Attack Type</div>
                  <div className="text-sm font-medium text-right">{selectedLog.details.attackType}</div>
                  <div className="text-sm text-muted-foreground">Source Country</div>
                  <div className="text-sm font-medium text-right">{selectedLog.details.sourceCountry}</div>
                  <div className="text-sm text-muted-foreground">Action Taken</div>
                  <div className="text-sm font-medium text-right">{selectedLog.details.actionTaken}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                {selectedLog.status !== "Safe" && (
                  <Button variant="default">
                    {selectedLog.status === "DDoS Detected" ? "Unblock IP" : "Mark as Safe"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
