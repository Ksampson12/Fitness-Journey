import { useState, useEffect } from "react";
import { useUserProfile, useUpdateProfile } from "@/hooks/use-user";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Bell, BellOff, Clock, Flame, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getNotificationPermission
} from "@/lib/notifications";

export default function Settings() {
  const { data: profile, refetch } = useUserProfile();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [streakReminderEnabled, setStreakReminderEnabled] = useState(true);
  const [workoutReminderTime, setWorkoutReminderTime] = useState("08:00");
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (profile) {
      setNotificationsEnabled(profile.notificationsEnabled || false);
      setStreakReminderEnabled(profile.streakReminderEnabled !== false);
      setWorkoutReminderTime(profile.workoutReminderTime || "08:00");
    }
    setPermissionStatus(getNotificationPermission());
  }, [profile]);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        const subscription = await subscribeToPushNotifications();
        if (subscription) {
          setNotificationsEnabled(true);
          toast({ title: "Notifications enabled", description: "You'll receive workout reminders now." });
          refetch();
        } else {
          toast({ title: "Setup incomplete", description: "Could not complete notification setup.", variant: "destructive" });
        }
      } else if (permission === "denied") {
        toast({ 
          title: "Permission denied", 
          description: "Please enable notifications in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to enable notifications:", error);
      toast({ title: "Error", description: "Failed to enable notifications.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPushNotifications();
      setNotificationsEnabled(false);
      toast({ title: "Notifications disabled", description: "You won't receive reminders anymore." });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to disable notifications.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      await apiRequest("PATCH", "/api/notifications/preferences", {
        streakReminderEnabled,
        workoutReminderTime
      });
      toast({ title: "Preferences saved" });
      refetch();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
    }
  };

  const handleSendTestNotification = async () => {
    try {
      await apiRequest("POST", "/api/notifications/test", {});
      toast({ title: "Test notification sent", description: "Check your notifications!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send test notification.", variant: "destructive" });
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center px-4 py-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/profile")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold ml-2">Settings</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        <section>
          <h2 className="text-sm font-bold uppercase text-muted-foreground mb-4 tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </h2>

          <div className="bg-card border border-white/5 rounded-xl p-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                  {permissionStatus === "denied" 
                    ? "Blocked in browser settings" 
                    : notificationsEnabled 
                      ? "Enabled" 
                      : "Get workout reminders"}
                </div>
              </div>
              {notificationsEnabled ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisableNotifications}
                  disabled={isLoading}
                  data-testid="button-disable-notifications"
                >
                  <BellOff className="w-4 h-4 mr-2" />
                  Disable
                </Button>
              ) : (
                <Button 
                  size="sm"
                  onClick={handleEnableNotifications}
                  disabled={isLoading || permissionStatus === "denied"}
                  data-testid="button-enable-notifications"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable
                </Button>
              )}
            </div>

            {notificationsEnabled && (
              <>
                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <div>
                        <div className="font-medium">Streak Reminders</div>
                        <div className="text-sm text-muted-foreground">Alert when streak is at risk</div>
                      </div>
                    </div>
                    <Switch
                      checked={streakReminderEnabled}
                      onCheckedChange={(checked) => {
                        setStreakReminderEnabled(checked);
                        handleUpdatePreferences();
                      }}
                      data-testid="switch-streak-reminder"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <div>
                        <div className="font-medium">Workout Reminder Time</div>
                        <div className="text-sm text-muted-foreground">Daily reminder to workout</div>
                      </div>
                    </div>
                    <Input
                      type="time"
                      value={workoutReminderTime}
                      onChange={(e) => setWorkoutReminderTime(e.target.value)}
                      onBlur={handleUpdatePreferences}
                      className="w-28 text-center"
                      data-testid="input-reminder-time"
                    />
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleSendTestNotification}
                    data-testid="button-test-notification"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Test Notification
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
      
      <Navigation />
    </div>
  );
}
