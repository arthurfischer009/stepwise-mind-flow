// Push Notification System
// Sends hourly reminders to keep users focused

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const scheduleHourlyReminders = () => {
  // Clear any existing intervals
  const existingInterval = (window as any).__hourlyReminderInterval;
  if (existingInterval) {
    clearInterval(existingInterval);
  }

  // Check if notifications are enabled
  if (Notification.permission !== 'granted') {
    return;
  }

  // Send notification immediately
  sendTaskReminder();

  // Schedule hourly reminders
  const interval = setInterval(() => {
    sendTaskReminder();
  }, 60 * 60 * 1000); // Every hour

  // Store interval globally so we can clear it later
  (window as any).__hourlyReminderInterval = interval;
};

export const stopHourlyReminders = () => {
  const existingInterval = (window as any).__hourlyReminderInterval;
  if (existingInterval) {
    clearInterval(existingInterval);
    (window as any).__hourlyReminderInterval = null;
  }
};

const sendTaskReminder = () => {
  // Get current task from localStorage or state
  const motivationalMessages = [
    "💪 Keep pushing! You're doing great!",
    "🎯 Stay focused on your current task!",
    "⏰ Time check - stay on track!",
    "🔥 You're on fire! Keep it up!",
    "✨ Another hour, another win!",
    "🚀 Progress is progress. Keep going!",
    "💎 Focus is your superpower!",
    "⚡ Energy check! Take a sip of water!",
  ];

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  try {
    const notification = new Notification('Focus Quest Reminder', {
      body: randomMessage,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'hourly-reminder',
      requireInteraction: false,
      silent: false,
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Break reminder - called after 45 minutes of work
export const sendBreakReminder = () => {
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification('☕ Break Time!', {
      body: 'You\'ve been focused for 45 minutes. Time for a 15-minute break!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'break-reminder',
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Error sending break notification:', error);
  }
};

// Work resume reminder - called after 15 minutes of break
export const sendWorkResumeReminder = () => {
  if (Notification.permission !== 'granted') return;

  try {
    const notification = new Notification('💪 Break Over!', {
      body: 'Ready to continue? Let\'s get back to work!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'work-resume',
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Error sending work resume notification:', error);
  }
};
