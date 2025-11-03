import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { requestNotificationPermission, scheduleHourlyReminders, stopHourlyReminders } from "@/lib/pushNotifications";
import { useToast } from "@/hooks/use-toast";

export const NotificationToggle = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved === 'true';
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check actual permission status
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());

    if (notificationsEnabled) {
      scheduleHourlyReminders();
    } else {
      stopHourlyReminders();
    }
  }, [notificationsEnabled]);

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permission
      const granted = await requestNotificationPermission();

      if (granted) {
        setNotificationsEnabled(true);
        toast({
          title: "🔔 Notifications Enabled",
          description: "You'll receive hourly reminders to stay focused!",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } else {
      setNotificationsEnabled(false);
      toast({
        title: "🔕 Notifications Disabled",
        description: "You won't receive any more reminders.",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleNotifications}
      className="gap-2"
      title={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
    >
      {notificationsEnabled ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {notificationsEnabled ? "Reminders On" : "Reminders Off"}
      </span>
    </Button>
  );
};
