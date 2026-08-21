import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
}

export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      osc.start(startTime); osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playTone(659.25, now, 0.3); playTone(880.00, now + 0.15, 0.5);
  } catch (err) { console.error('Audio play failed', err); }
};

export const subscribeToPush = async (token: string, showUI: boolean = false) => {
  if (Capacitor.isNativePlatform()) {
    if (showUI) {
      alert("Bildirishnomalar muvaffaqiyatli faollashtirildi!");
      // Send a test notification immediately
      showNotification("Sinov", "Bildirishnomalar to'g'ri ishlamoqda! 🚀");
    }
    return; // Native uses LocalNotifications directly
  }

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const keyRes = await fetch('/api/vapid-public-key');
      const { publicKey } = await keyRes.json();
      if (!publicKey) return;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey)
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
    if (showUI) alert("Sizning brauzeringiz Push xabarlarni qo'llab-quvvatlamaydi.");
  }
};

export const checkNotificationPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    const perm = await LocalNotifications.checkPermissions();
    return perm.display === 'granted';
  }
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
};

export const requestNotificationPermission = async (token?: string) => {
  if (Capacitor.isNativePlatform()) {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display === 'granted') {
      if (token) subscribeToPush(token, true);
      return true;
    }
    return false;
  }

  if (typeof Notification === "undefined") {
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

  export const showNotification = async (title: string, body: string) => {
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [{
              title, 
              body, 
              id: Math.floor(Math.random() * 2000000000), // Must be 32-bit int
              schedule: { at: new Date(Date.now() + 1000) }
            }]
          });
          playNotificationSound();
        }
      } catch (err) {
        console.error("Local notification schedule error:", err);
      }
      return;
    }

  if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
    new Notification(title, { body, icon: '/vite.svg', badge: '/vite.svg' });
    playNotificationSound();
  }
};

let lastSyncHash = "";

const syncNativeNotifications = async (plans: any[], reminders: any[]) => {
  if (!Capacitor.isNativePlatform()) return;
  
  const currentHash = JSON.stringify(plans) + JSON.stringify(reminders);
  if (currentHash === lastSyncHash) return;
  lastSyncHash = currentHash;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;

    // Clear all existing scheduled notifications to avoid duplicates
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    const notificationsToSchedule = [];
    let idCounter = 1;

    // Schedule daily reminders
    for (const r of reminders) {
      if (!r.isActive || !r.time) continue;
      const [hour, minute] = r.time.split(':').map(Number);
      notificationsToSchedule.push({
        title: "Eslatma",
        body: r.name,
        id: idCounter++,
        schedule: { 
          on: { hour, minute }, 
          allowWhileIdle: true 
        }
      });
    }

    // Schedule specific repetition sessions
    const now = new Date();
    for (const plan of plans) {
      for (const s of plan.sessions) {
        if (s.status === 'Kutilmoqda' && s.date && s.time) {
          const sessionDate = new Date(`${s.date}T${s.time}:00`);
          if (sessionDate > now) {
            notificationsToSchedule.push({
              title: "Takrorlash vaqti",
              body: `${plan.surah?.name || 'Sura'} - takrorlash jadvali bo'yicha`,
              id: idCounter++,
              schedule: { at: sessionDate, allowWhileIdle: true }
            });
          }
        }
      }
    }

    if (notificationsToSchedule.length > 0) {
      // Capacitor limits how many you can schedule at once, but usually it's fine for < 50
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (err) {
    console.error("Native sync error:", err);
  }
};

export function useNotifications(currentUser: any) {
  const checkInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    
    checkNotificationPermission().then(granted => {
      if (granted) subscribeToPush(currentUser.token);
    });

    const fetchAndSync = async () => {
      try {
        const [plansRes, remindersRes] = await Promise.all([
          fetch('/api/repetition/plans', { headers: { 'Authorization': `Bearer ${currentUser.token}` } }),
          fetch('/api/reminders', { headers: { 'Authorization': `Bearer ${currentUser.token}` } })
        ]);

        if (plansRes.ok && remindersRes.ok) {
          const plans = await plansRes.json();
          const reminders = await remindersRes.json();
          await syncNativeNotifications(plans, reminders);
          return { plans, reminders };
        }
      } catch (err) {
        console.error("Fetch plans/reminders error:", err);
      }
      return null;
    };

    const checkReminders = async () => {
      const data = await fetchAndSync();
      if (!data) return;
      const { plans, reminders } = data;

      // Web Push polling logic (only runs if app is open)
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];
      
      const triggeredKey = `notified_${todayStr}_${currentTime}`;
      if (sessionStorage.getItem(triggeredKey)) return;

      let shouldNotify = false;
      let notificationBody = "";

      const activeReminders = reminders.filter((r: any) => r.isActive && r.time === currentTime);
      if (activeReminders.length > 0) {
        shouldNotify = true;
        notificationBody += activeReminders.map((r: any) => r.name).join(', ') + "\n";
      }

      let surahsToRepeat = [];
      for (const plan of plans) {
        const todaySessions = plan.sessions.filter((s: any) => s.date === todayStr && s.status === 'Kutilmoqda' && s.time === currentTime);
        if (todaySessions.length > 0) surahsToRepeat.push(plan.surah.name);
      }
      if (surahsToRepeat.length > 0) {
        shouldNotify = true;
        notificationBody += `Takrorlash: ${surahsToRepeat.join(', ')}`;
      }

      if (shouldNotify) {
        // Fallback to web notification logic since native will handle it via pre-scheduled
        if (!Capacitor.isNativePlatform()) {
          showNotification("Eslatma!", notificationBody.trim());
        }
        sessionStorage.setItem(triggeredKey, "true");
      }
    };

    // We only need to poll for web. For native, fetchAndSync schedules everything ahead!
    if (!Capacitor.isNativePlatform()) {
      checkInterval.current = window.setInterval(checkReminders, 30000);
    }
    
    // Always run once on mount to schedule (native) or alert (web)
    checkReminders();

    return () => { if (checkInterval.current) clearInterval(checkInterval.current); };
  }, [currentUser]);
}
