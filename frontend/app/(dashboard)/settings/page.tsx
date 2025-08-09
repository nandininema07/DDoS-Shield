"use client"

import type React from "react"

import { useState } from "react"
import { Bell, Globe, Mail, Phone, Save, Shield, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Profile settings
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 000-0000",
  })

  // Website settings
  const [website, setWebsite] = useState({
    url: "https://example.com",
  })

  // Alert settings
  const [alerts, setAlerts] = useState({
    emailAlerts: true,
    phoneAlerts: false,
    attackNotifications: true,
    systemUpdates: true,
    weeklyReports: true,
  })

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setWebsite((prev) => ({ ...prev, [name]: value }))
  }

  const handleAlertsChange = (name: string, checked: boolean) => {
    setAlerts((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSaveSettings = (section: string) => {
    setIsLoading(true)

    // Simulate saving settings
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Settings saved",
        description: `Your ${section} settings have been updated successfully.`,
      })
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and system preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Settings
              </CardTitle>
              <CardDescription>Manage your personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Change Avatar
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={profile.name} onChange={handleProfileChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" value={profile.email} onChange={handleProfileChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" type="tel" value={profile.phone} onChange={handleProfileChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" placeholder="••••••••" />
                  <p className="text-xs text-muted-foreground">Leave blank to keep current password</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSaveSettings("profile")} disabled={isLoading}>
                {isLoading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="website" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Website Settings
              </CardTitle>
              <CardDescription>Configure the website being monitored for DDoS attacks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  name="url"
                  value={website.url}
                  onChange={handleWebsiteChange}
                  placeholder="https://example.com"
                />
                <p className="text-xs text-muted-foreground">Enter the primary domain you want to protect</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Advanced Settings</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="threshold">DDoS Detection Threshold</Label>
                    <Input id="threshold" type="number" defaultValue="4000" />
                    <p className="text-xs text-muted-foreground">Requests per minute</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sensitivity">ML Model Sensitivity</Label>
                    <Input id="sensitivity" type="range" min="1" max="10" defaultValue="7" className="cursor-pointer" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>Medium</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSaveSettings("website")} disabled={isLoading}>
                {isLoading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Alert Settings
              </CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="emailAlerts" className="cursor-pointer">
                        Email Alerts
                      </Label>
                    </div>
                    <Switch
                      id="emailAlerts"
                      checked={alerts.emailAlerts}
                      onCheckedChange={(checked) => handleAlertsChange("emailAlerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="phoneAlerts" className="cursor-pointer">
                        Phone Alerts (SMS/Call)
                      </Label>
                    </div>
                    <Switch
                      id="phoneAlerts"
                      checked={alerts.phoneAlerts}
                      onCheckedChange={(checked) => handleAlertsChange("phoneAlerts", checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alert Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="attackNotifications" className="cursor-pointer">
                        Attack Notifications
                      </Label>
                    </div>
                    <Switch
                      id="attackNotifications"
                      checked={alerts.attackNotifications}
                      onCheckedChange={(checked) => handleAlertsChange("attackNotifications", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="systemUpdates" className="cursor-pointer">
                        System Updates
                      </Label>
                    </div>
                    <Switch
                      id="systemUpdates"
                      checked={alerts.systemUpdates}
                      onCheckedChange={(checked) => handleAlertsChange("systemUpdates", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="weeklyReports" className="cursor-pointer">
                        Weekly Summary Reports
                      </Label>
                    </div>
                    <Switch
                      id="weeklyReports"
                      checked={alerts.weeklyReports}
                      onCheckedChange={(checked) => handleAlertsChange("weeklyReports", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSaveSettings("alerts")} disabled={isLoading}>
                {isLoading ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
