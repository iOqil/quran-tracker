import fs from 'fs';

const filePath = 'c:\\\\Users\\\\imomn\\\\Desktop\\\\KuranTracker\\\\server\\\\src\\\\index.ts';
let content = fs.readFileSync(filePath, 'utf-8');

const reminderRoutes = `
// --- REMINDER ROUTES ---
app.get('/api/reminders', authenticateUser, async (req: any, res: any) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.user.id }
    });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

app.post('/api/reminders', authenticateUser, async (req: any, res: any) => {
  try {
    const { name, time, isActive } = req.body;
    const reminder = await prisma.reminder.create({
      data: {
        userId: req.user.id,
        name,
        time,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

app.put('/api/reminders/:id', authenticateUser, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { isActive, name, time } = req.body;
    const reminder = await prisma.reminder.update({
      where: { id: parseInt(id) },
      data: { isActive, name, time }
    });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

app.delete('/api/reminders/:id', authenticateUser, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await prisma.reminder.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});
`;

if (!content.includes('/api/reminders')) {
  content = content.replace("// Serve client static assets in production", reminderRoutes + "\n// Serve client static assets in production");
}

fs.writeFileSync(filePath, content, 'utf-8');
