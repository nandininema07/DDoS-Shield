"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Bell, Globe, Mail, Phone, Save, Shield, User, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const API_BASE_URL = "http://127.0.0.1:8001";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" })
  const [website, setWebsite] = useState({ url: "" })
  const [alerts, setAlerts] = useState({ emailAlerts: true, phoneAlerts: false })
  const [advanced, setAdvanced] = useState({ ddosThreshold: 50 })
  const [resolvedIp, setResolvedIp] = useState("N/A")

  const fetchSettings = useCallback(async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/settings`);
        if (!response.ok) {
            // If no user is found, the API returns 404. This is expected before signup.
            if (response.status === 404) {
                console.log("No user settings found. Please sign up or log in.");
                return;
            }
            throw new Error("Failed to fetch settings");
        }
        const data = await response.json();
        setProfile(data.profile);
        setWebsite(data.website);
        setAlerts(data.alerts);
        setAdvanced(data.advanced);
        
        if (data.website.url) {
            const ipResponse = await fetch(`${API_BASE_URL}/api/get-ip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: data.website.url }),
            });
            const ipData = await ipResponse.json();
            setResolvedIp(ipData.ip_address);
        }
    } catch (error) {
        console.error("Failed to fetch settings:", error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // --- FIX: A single, generic handler for all input changes ---
  const handleInputChange = (setter) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleAlertsChange = (name: string, checked: boolean) => {
    setAlerts((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSaveSettings = async (section: string) => {
    setIsLoading(true)
    let payload = {};
    if (section === 'profile') {
        payload = { username: profile.name, email: profile.email, phone_number: profile.phone };
    } else if (section === 'website') {
        payload = { website_url: website.url, ddos_threshold: parseInt(advanced.ddosThreshold, 10) };
    } else if (section === 'alerts') {
        payload = { email_alerts: alerts.emailAlerts, phone_alerts: alerts.phoneAlerts };
    }

    try {
        await fetch(`${API_BASE_URL}/api/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        await fetchSettings();
    } catch (error) {
        console.error(`Failed to save ${section} settings:`, error);
    } finally {
        setIsLoading(false);
    }
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {/* --- FIX: Use the correct handler function --- */}
                  <Input id="name" name="name" value={profile.name} onChange={handleInputChange(setProfile)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {/* --- FIX: Use the correct handler function --- */}
                  <Input id="email" name="email" type="email" value={profile.email} onChange={handleInputChange(setProfile)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {/* --- FIX: Use the correct handler function --- */}
                  <Input id="phone" name="phone" type="tel" value={profile.phone} onChange={handleInputChange(setProfile)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSaveSettings("profile")} disabled={isLoading}>
                {isLoading ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
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
                  onChange={handleInputChange(setWebsite)}
                  placeholder="https://example.com"
                />
                 <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Resolved Origin Server IP: <span className="font-mono">{resolvedIp}</span>
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                 <Label htmlFor="ddosThreshold">DDoS Detection Threshold</Label>
                 <Input 
                    id="ddosThreshold" 
                    name="ddosThreshold" 
                    type="number" 
                    value={advanced.ddosThreshold}
                    onChange={handleInputChange(setAdvanced)}
                 />
                 <p className="text-xs text-muted-foreground">
                    Number of malicious flows from a single IP within the time window to trigger an alert.
                 </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSaveSettings("website")} disabled={isLoading}>
                {isLoading ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
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
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailAlerts">Email Alerts</Label>
                <Switch id="emailAlerts" checked={alerts.emailAlerts} onCheckedChange={(c) => handleAlertsChange("emailAlerts", c)} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="phoneAlerts">Phone Alerts</Label>
                <Switch id="phoneAlerts" checked={alerts.phoneAlerts} onCheckedChange={(c) => handleAlertsChange("phoneAlerts", c)} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => handleSaveSettings("alerts")} disabled={isLoading}>
                {isLoading ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
