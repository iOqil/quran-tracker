import { useEffect, useRef } from 'react';

// A simple beep sound using Web Audio API
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(659.25, now, 0.3); // E5
    playTone(880.00, now + 0.15, 0.5); // A5
  } catch (err) {
    console.error('Audio play failed', err);
  }
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    alert("Brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi.");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
};

export const showNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: '/vite.svg', // Use app icon if available
      badge: '/vite.svg'
    });
    playNotificationSound();
  }
};

export function useNotifications(currentUser: any) {
  const checkInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const checkReminders = async () => {
      try {
        // Fetch today's actionable items
        const [plansRes, remindersRes] = await Promise.all([
          fetch('/api/repetition/plans', {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
          }),
          // Assuming reminders are local for now as per current implementation, 
          // or we can fetch them if they are on backend.
          // In the current implementation, reminders are in localStorage!
          Promise.resolve(localStorage.getItem(`userReminders_${currentUser.id}`))
        ]);

        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        const todayStr = now.toISOString().split('T')[0];
        
        // Ensure we only trigger once per minute per type
        const triggeredKey = `notified_${todayStr}_${currentTime}`;
        if (sessionStorage.getItem(triggeredKey)) return;

        let shouldNotify = false;
        let notificationBody = "";

        // Check local reminders
        if (remindersRes) {
          const reminders = JSON.parse(remindersRes);
          const activeReminders = reminders.filter((r: any) => r.isActive && r.time === currentTime);
          if (activeReminders.length > 0) {
            shouldNotify = true;
            notificationBody += activeReminders.map((r: any) => r.name).join(', ') + "\\n";
          }
        }

        // Check repetition plans
        if (plansRes.ok) {
          const plans = await plansRes.json();
          let surahsToRepeat = [];
          for (const plan of plans) {
            const todaySessions = plan.sessions.filter((s: any) => s.date === todayStr && s.status === 'Kutilmoqda' && s.time === currentTime);
            if (todaySessions.length > 0) {
              surahsToRepeat.push(plan.surah.name);
            }
          }
          if (surahsToRepeat.length > 0) {
            shouldNotify = true;
            notificationBody += `Takrorlash: ${surahsToRepeat.join(', ')}`;
          }
        }

        if (shouldNotify) {
          showNotification("Eslatma!", notificationBody.trim());
          sessionStorage.setItem(triggeredKey, "true");
        }

      } catch (err) {
        console.error("Error checking notifications:", err);
      }
    };

    // Check every 30 seconds
    checkInterval.current = window.setInterval(checkReminders, 30000);
    
    // Initial check
    checkReminders();

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [currentUser]);
}
