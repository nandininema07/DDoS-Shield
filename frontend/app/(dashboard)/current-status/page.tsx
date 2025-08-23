"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle, Check, Info, Search, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const API_BASE_URL = "http://127.0.0.1:8000"

export default function CurrentStatusPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // --- State for API data ---
  const [liveData, setLiveData] = useState([])
  const [logData, setLogData] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])

  const [selectedLog, setSelectedLog] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // --- Fetch data from the backend ---
  const fetchData = useCallback(async () => {
    try {
      const [liveRes, logRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/live-activity-chart`),
        fetch(`${API_BASE_URL}/api/traffic-log`) // Fetch all logs initially
      ]);
      const liveData = await liveRes.json();
      const logData = await logRes.json();
      
      setLiveData(liveData);
      setLogData(logData);
      setFilteredLogs(logData); // Initially, show all logs
    } catch (error) {
      console.error("Failed to fetch current status data:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- Client-side filtering logic ---
  useEffect(() => {
    let logs = logData;

    if (searchQuery) {
      logs = logs.filter(log => log.source_ip.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (statusFilter !== "all") {
      // Since we only have "DDoS Detected" logs, this simplifies the filter.
      if (statusFilter === "ddos detected") {
        logs = logs.filter(log => log.details.type); // Check if it's an attack log
      } else {
        logs = []; // No logs for "Safe" or "Flagged" yet
      }
    }
    
    setFilteredLogs(logs);
  }, [searchQuery, statusFilter, logData]);


  const handleViewDetails = (log) => {
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
          <CardDescription>Detected malicious traffic rate over the last hour</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="traffic"
                  stroke="#8884d8"
                  name="Detected Attack Traffic"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="#ff0000"
                  strokeDasharray="5 5"
                  name="Alert Threshold"
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
                <SelectItem value="flagged">Flagged (Not Implemented)</SelectItem>
                <SelectItem value="safe">Safe (Not Implemented)</SelectItem>
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
                    <TableCell className="font-mono">{log.source_ip}</TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        <ShieldAlert className="mr-1 h-3 w-3" />
                        DDoS Detected
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
              <DialogTitle>IP Details: {selectedLog.source_ip}</DialogTitle>
              <DialogDescription>Detailed information about this traffic log</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between rounded-lg bg-muted p-3">
                <div className="font-medium">Status</div>
                <Badge variant="destructive">DDoS Detected</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">ML Model Analysis</div>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Attack Type</div>
                  <div className="text-sm font-medium text-right">{selectedLog.details.type || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Total Packets</div>
                  <div className="text-sm font-medium text-right">{selectedLog.details.total_packets || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Total Bytes</div>
                  <div className="text-sm font-medium text-right">{selectedLog.details.total_bytes || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Flow Duration (s)</div>
                  <div className="text-sm font-medium text-right">{selectedLog.details.flow_duration?.toFixed(4) || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Action Taken</div>
                  <div className="text-sm font-medium text-right">Blocked</div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
