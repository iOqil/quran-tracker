const fs = require('fs');

const filePath = 'c:\\\\Users\\\\imomn\\\\Desktop\\\\KuranTracker\\\\server\\\\src\\\\index.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const importStr = `import { initCronJobs } from './push';\n\ninitCronJobs();\n`;

if (!content.includes('initCronJobs')) {
  // Add import at the top after other imports
  content = content.replace("import cors from 'cors';", "import cors from 'cors';\n" + importStr);
}

const pushRoutes = `
// --- PUSH NOTIFICATION ROUTES ---
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', authenticateToken, async (req: any, res: any) => {
  try {
    const user = req.user;
    const subscription = req.body;
    
    // Upsert subscription (if endpoint exists, ignore or update)
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint: subscription.endpoint }
    });
    
    if (!existing) {
      await prisma.pushSubscription.create({
        data: {
          userId: user.id,
          endpoint: subscription.endpoint,
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh
        }
      });
    }
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
`;

if (!content.includes('/api/push/subscribe')) {
  content = content.replace("// Serve client static assets in production", pushRoutes + "\n// Serve client static assets in production");
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Updated index.ts");
