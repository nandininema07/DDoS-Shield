"use client"

import { useState } from "react"
import { AlertCircle, Check, Info, Search, ShieldAlert, ShieldCheck, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

// Sample data for the blacklist
const blacklistData = [
  {
    id: 1,
    ipAddress: "192.168.1.45",
    date: "2023-04-09",
    time: "10:23:45",
    action: "Blocked",
    status: "Active",
    reason: "SYN Flood Attack",
    details: {
      confidence: 0.95,
      packetRate: "12,500/sec",
      trafficVolume: "1.2 GB/min",
      attackType: "SYN Flood",
      sourceCountry: "Unknown",
      blockedSince: "2023-04-09 10:23:45",
    },
  },
  {
    id: 2,
    ipAddress: "203.45.67.89",
    date: "2023-04-09",
    time: "09:15:30",
    action: "Flagged",
    status: "Monitoring",
    reason: "Suspicious HTTP Requests",
    details: {
      confidence: 0.75,
      packetRate: "8,200/sec",
      trafficVolume: "750 MB/min",
      attackType: "HTTP Flood",
      sourceCountry: "Russia",
      blockedSince: "N/A",
    },
  },
  {
    id: 3,
    ipAddress: "78.90.12.34",
    date: "2023-04-09",
    time: "07:30:55",
    action: "Blocked",
    status: "Active",
    reason: "UDP Flood Attack",
    details: {
      confidence: 0.92,
      packetRate: "15,800/sec",
      trafficVolume: "1.8 GB/min",
      attackType: "UDP Flood",
      sourceCountry: "China",
      blockedSince: "2023-04-09 07:30:55",
    },
  },
  {
    id: 4,
    ipAddress: "112.34.56.78",
    date: "2023-04-09",
    time: "06:20:10",
    action: "Flagged",
    status: "Monitoring",
    reason: "DNS Amplification Attempt",
    details: {
      confidence: 0.68,
      packetRate: "5,600/sec",
      trafficVolume: "480 MB/min",
      attackType: "DNS Amplification",
      sourceCountry: "Brazil",
      blockedSince: "N/A",
    },
  },
  {
    id: 5,
    ipAddress: "45.67.123.45",
    date: "2023-04-08",
    time: "22:15:30",
    action: "Blocked",
    status: "Active",
    reason: "TCP Connection Flood",
    details: {
      confidence: 0.88,
      packetRate: "9,800/sec",
      trafficVolume: "950 MB/min",
      attackType: "TCP Connection Flood",
      sourceCountry: "Ukraine",
      blockedSince: "2023-04-08 22:15:30",
    },
  },
  {
    id: 6,
    ipAddress: "89.123.45.67",
    date: "2023-04-08",
    time: "18:45:12",
    action: "Flagged",
    status: "Resolved",
    reason: "Unusual Traffic Pattern",
    details: {
      confidence: 0.62,
      packetRate: "4,200/sec",
      trafficVolume: "320 MB/min",
      attackType: "Unknown",
      sourceCountry: "Germany",
      blockedSince: "N/A",
    },
  },
]

export default function BlacklistPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState<(typeof blacklistData)[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const filteredData = blacklistData.filter((item) => {
    const matchesSearch = item.ipAddress.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = actionFilter === "all" || item.action.toLowerCase() === actionFilter.toLowerCase()
    return matchesSearch && matchesAction
  })

  const handleViewDetails = (item: (typeof blacklistData)[0]) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }

  const handleStatusChange = (item: (typeof blacklistData)[0], newStatus: string) => {
    toast({
      title: `IP ${item.ipAddress} status updated`,
      description: `Status changed to ${newStatus}`,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Blacklist</h1>
        <p className="text-muted-foreground">Manage blocked and flagged IP addresses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Blacklist Management
          </CardTitle>
          <CardDescription>View and manage all blocked and flagged IP addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="blocked">Blocked</TabsTrigger>
                <TabsTrigger value="flagged">Flagged</TabsTrigger>
              </TabsList>
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
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <TabsContent value="all">
                <BlacklistTable
                  data={filteredData}
                  onViewDetails={handleViewDetails}
                  onStatusChange={handleStatusChange}
                />
              </TabsContent>
              <TabsContent value="blocked">
                <BlacklistTable
                  data={filteredData.filter((item) => item.action === "Blocked")}
                  onViewDetails={handleViewDetails}
                  onStatusChange={handleStatusChange}
                />
              </TabsContent>
              <TabsContent value="flagged">
                <BlacklistTable
                  data={filteredData.filter((item) => item.action === "Flagged")}
                  onViewDetails={handleViewDetails}
                  onStatusChange={handleStatusChange}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedItem && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>IP Details: {selectedItem.ipAddress}</DialogTitle>
              <DialogDescription>
                Detailed information about this {selectedItem.action.toLowerCase()} IP
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between rounded-lg bg-muted p-3">
                <div className="font-medium">Status</div>
                <Badge variant={selectedItem.action === "Blocked" ? "destructive" : "default"}>
                  {selectedItem.action === "Blocked" ? (
                    <ShieldAlert className="mr-1 h-3 w-3" />
                  ) : (
                    <AlertCircle className="mr-1 h-3 w-3" />
                  )}
                  {selectedItem.action} - {selectedItem.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Reason</div>
                <div className="rounded-lg border p-3 text-sm">{selectedItem.reason}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Details</div>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className="text-sm font-medium text-right">
                    {(selectedItem.details.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Packet Rate</div>
                  <div className="text-sm font-medium text-right">{selectedItem.details.packetRate}</div>
                  <div className="text-sm text-muted-foreground">Traffic Volume</div>
                  <div className="text-sm font-medium text-right">{selectedItem.details.trafficVolume}</div>
                  <div className="text-sm text-muted-foreground">Attack Type</div>
                  <div className="text-sm font-medium text-right">{selectedItem.details.attackType}</div>
                  <div className="text-sm text-muted-foreground">Source Country</div>
                  <div className="text-sm font-medium text-right">{selectedItem.details.sourceCountry}</div>
                  <div className="text-sm text-muted-foreground">Blocked Since</div>
                  <div className="text-sm font-medium text-right">{selectedItem.details.blockedSince}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>
                {selectedItem.action === "Blocked" ? (
                  <Button variant="default" onClick={() => handleStatusChange(selectedItem, "Unblocked")}>
                    <ShieldCheck className="mr-1 h-4 w-4" />
                    Unblock IP
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => handleStatusChange(selectedItem, "Blocked")}>
                    <ShieldAlert className="mr-1 h-4 w-4" />
                    Block IP
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

interface BlacklistTableProps {
  data: typeof blacklistData
  onViewDetails: (item: (typeof blacklistData)[0]) => void
  onStatusChange: (item: (typeof blacklistData)[0], newStatus: string) => void
}

function BlacklistTable({ data, onViewDetails, onStatusChange }: BlacklistTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IP Address</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.ipAddress}</TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.time}</TableCell>
                <TableCell>
                  <Badge variant={item.action === "Blocked" ? "destructive" : "default"}>
                    {item.action === "Blocked" ? (
                      <ShieldAlert className="mr-1 h-3 w-3" />
                    ) : (
                      <AlertCircle className="mr-1 h-3 w-3" />
                    )}
                    {item.action}
                  </Badge>
                </TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={item.reason}>
                  {item.reason}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(item)}>
                      <Info className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                    {item.action === "Blocked" ? (
                      <Button variant="outline" size="sm" onClick={() => onStatusChange(item, "Unblocked")}>
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Unblock</span>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => onStatusChange(item, "Blocked")}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Block</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
