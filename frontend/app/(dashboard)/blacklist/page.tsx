"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertCircle, Check, Info, Search, ShieldAlert, ShieldCheck, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// The useToast import has been removed to resolve the compilation error.
// The toast notifications will be temporarily disabled.

const API_BASE_URL = "http://127.0.0.1:8000"

export default function BlacklistPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // --- State for API data ---
  const [blacklistData, setBlacklistData] = useState([])
  const [filteredData, setFilteredData] = useState([])

  // --- Fetch data from the backend ---
  const fetchBlacklist = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blacklist`);
      const data = await response.json();
      setBlacklistData(data);
    } catch (error) {
      console.error("Failed to fetch blacklist data:", error);
      // Removed toast notification due to import error
    }
  }, []);

  useEffect(() => {
    fetchBlacklist();
  }, [fetchBlacklist]);

  // --- Client-side filtering logic ---
  useEffect(() => {
    let data = blacklistData;
    if (searchQuery) {
      data = data.filter(item => item.ip_address.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    // Note: The "Flagged" status is conceptual for the UI. All items from the DB are "Blocked".
    // A simple filter for "Blocked" is sufficient for now.
    if (actionFilter === "blocked") {
        data = data.filter(item => item.reason); // Assuming all items in blacklist are blocked
    }
    setFilteredData(data);
  }, [searchQuery, actionFilter, blacklistData]);

  const handleViewDetails = (item) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }

  // --- Handle Unblocking an IP ---
  const handleUnblockIp = async (ipAddress) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/blacklist/${ipAddress}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unblock IP');
      }
      
      console.log(`Successfully removed ${ipAddress} from the blacklist.`);
      // Refresh the list after unblocking
      fetchBlacklist();
    } catch (error) {
      console.error("Error unblocking IP:", error);
    }
  };

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
          <CardDescription>View and manage all blocked IP addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={(value) => setActionFilter(value)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="blocked">Blocked</TabsTrigger>
                <TabsTrigger value="flagged" disabled>Flagged</TabsTrigger>
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
              </div>
            </div>

            <div className="mt-4">
              <TabsContent value="all">
                <BlacklistTable
                  data={filteredData}
                  onViewDetails={handleViewDetails}
                  onUnblock={handleUnblockIp}
                />
              </TabsContent>
              <TabsContent value="blocked">
                <BlacklistTable
                  data={filteredData} // Filtering is already applied
                  onViewDetails={handleViewDetails}
                  onUnblock={handleUnblockIp}
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
              <DialogTitle>IP Details: {selectedItem.ip_address}</DialogTitle>
              <DialogDescription>
                Detailed information about this blocked IP
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
               <div className="flex justify-between rounded-lg bg-muted p-3">
                <div className="font-medium">Status</div>
                <Badge variant="destructive">
                  <ShieldAlert className="mr-1 h-3 w-3" />
                  Blocked - Active
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Reason for Blacklisting</div>
                <div className="rounded-lg border p-3 text-sm">{selectedItem.reason}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Details</div>
                 <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
                   <div className="text-sm text-muted-foreground">Blocked Since</div>
                   <div className="text-sm font-medium text-right">{new Date(selectedItem.timestamp).toLocaleString()}</div>
                 </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
                <Button variant="default" onClick={() => {
                  handleUnblockIp(selectedItem.ip_address);
                  setIsDialogOpen(false);
                }}>
                  <ShieldCheck className="mr-1 h-4 w-4" />
                  Unblock IP
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

function BlacklistTable({ data, onViewDetails, onUnblock }) {
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
                <TableCell className="font-mono">{item.ip_address}</TableCell>
                <TableCell>{new Date(item.timestamp).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(item.timestamp).toLocaleTimeString()}</TableCell>
                <TableCell>
                  <Badge variant="destructive">
                    <ShieldAlert className="mr-1 h-3 w-3" />
                    Blocked
                  </Badge>
                </TableCell>
                <TableCell>Active</TableCell>
                <TableCell className="max-w-[200px] truncate" title={item.reason}>
                  {item.reason}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(item)}>
                      <Info className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onUnblock(item.ip_address)}>
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Unblock</span>
                    </Button>
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
