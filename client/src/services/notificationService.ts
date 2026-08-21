import { useEffect, useRef } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// A simple beep sound using Web Audio API
export const playNotificationSound = () => {
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

export const subscribeToPush = async (token: string, showUI: boolean = false) => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const keyRes = await fetch('/api/vapid-public-key');
      const { publicKey } = await keyRes.json();
      
      if (!publicKey) return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(subscription)
      });
      if (showUI) alert("Bildirishnomalar muvaffaqiyatli ulandi!");
    } catch (e) {
      console.error('Push subscription failed:', e);
      if (showUI) alert("Ulanishda xatolik: " + e);
    }
  } else {
    if (showUI) alert("Sizning brauzeringiz Push xabarlarni qo'llab-quvvatlamaydi (yoki HTTPS kerak).");
  }
};

export const requestNotificationPermission = async (token?: string) => {
  if (!("Notification" in window)) {
    alert("Brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi.");
    return false;
  }
  
  if (Notification.permission === "granted") {
    if (token) subscribeToPush(token, true);
    return true;
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      if (token) subscribeToPush(token, true);
      return true;
    }
  }
  
  return false;
};

export const showNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: '/vite.svg',
      badge: '/vite.svg'
    });
    playNotificationSound();
  }
};

export function useNotifications(currentUser: any) {
  const checkInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    
    // Automatically try to subscribe if permission is already granted
    if (Notification.permission === 'granted') {
      subscribeToPush(currentUser.token);
    }

    const checkReminders = async () => {
      try {
        const [plansRes, remindersRes] = await Promise.all([
          fetch('/api/repetition/plans', {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
          }),
          fetch('/api/reminders', {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
          })
        ]);

        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        const todayStr = now.toISOString().split('T')[0];
        
        const triggeredKey = `notified_${todayStr}_${currentTime}`;
        if (sessionStorage.getItem(triggeredKey)) return;

        let shouldNotify = false;
        let notificationBody = "";

        if (remindersRes.ok) {
          const reminders = await remindersRes.json();
          const activeReminders = reminders.filter((r: any) => r.isActive && r.time === currentTime);
          if (activeReminders.length > 0) {
            shouldNotify = true;
            notificationBody += activeReminders.map((r: any) => r.name).join(', ') + "\\n";
          }
        }

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

    checkInterval.current = window.setInterval(checkReminders, 30000);
    checkReminders();

    return () => {
      if (checkInterval.current) clearInterval(checkInterval.current);
    };
  }, [currentUser]);
}
