import webpush from 'web-push';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:test@test.com';

if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(subject, publicVapidKey, privateVapidKey);
} else {
  console.warn("VAPID keys not configured!");
}

export function initCronJobs() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Add timezone offset to match client if necessary. Assuming server is same TZ.
      // Better way: query status="Kutilmoqda" and match hours/minutes in DB timezone or UTC.
      // Since `time` is "HH:mm" in local time of the user when created...
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      // 1. Find Repetition Sessions
      const sessions = await prisma.repetitionSession.findMany({
        where: {
          status: 'Kutilmoqda',
          date: todayStr,
          time: currentTime,
        },
        include: {
          plan: {
            include: { surah: true }
          },
          user: {
            include: { pushSubscriptions: true }
          }
        }
      });

      for (const session of sessions) {
        const payload = JSON.stringify({
          title: 'Takrorlash vaqti!',
          body: `Sura: ${session.plan.surah.name}`,
          url: '/reminders'
        });
        
        for (const sub of session.user.pushSubscriptions) {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh
            }
          };
          try {
            await webpush.sendNotification(pushSubscription, payload);
          } catch (e) {
            console.error("Error sending push:", e);
            if ((e as any).statusCode === 410) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          }
        }
      }

      // 2. Find local reminders migrated to DB (if any)
      const reminders = await prisma.reminder.findMany({
        where: {
          time: currentTime,
          isActive: true
        },
        include: {
          user: {
            include: { pushSubscriptions: true }
          }
        }
      });

      for (const reminder of reminders) {
        const payload = JSON.stringify({
          title: 'Eslatma!',
          body: reminder.name,
          url: '/reminders'
        });
        
        for (const sub of reminder.user.pushSubscriptions) {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh
            }
          };
          try {
            await webpush.sendNotification(pushSubscription, payload);
          } catch (e) {
            console.error("Error sending push:", e);
            if ((e as any).statusCode === 410) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          }
        }
      }

    } catch (err) {
      console.error('Error in cron job', err);
    }
  });
}
