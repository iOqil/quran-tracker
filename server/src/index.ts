import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_production_secret_key_change_me_12984';

app.use(cors());
app.use(express.json());

// Initialize a single global Prisma Client instance (connects to MySQL via process.env.DATABASE_URL)
const prisma = new PrismaClient();

// Helper to log user daily activity counts
async function logActivity(userId: number, type: 'todo' | 'verse', incrementValue: number) {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  const localISODate = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);

  try {
    const existing = await prisma.activityLog.findUnique({
      where: {
        userId_date_type: {
          userId,
          date: localISODate,
          type
        }
      }
    });

    if (existing) {
      const newCount = Math.max(0, existing.count + incrementValue);
      if (newCount === 0) {
        await prisma.activityLog.delete({
          where: { id: existing.id }
        });
      } else {
        await prisma.activityLog.update({
          where: { id: existing.id },
          data: { count: newCount }
        });
      }
    } else if (incrementValue > 0) {
      await prisma.activityLog.create({
        data: {
          userId,
          date: localISODate,
          type,
          count: incrementValue
        }
      });
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Authenticate Middleware: extracts and verifies JWT from Bearer Authorization header
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Ruxsat etilmagan so\'rov (Token topilmadi)' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ error: 'Foydalanuvchi tizimda mavjud emas' });
    }

    req.body.user = user; // attach user details to request
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.status(401).json({ error: 'Ruxsat etilmagan so\'rov (Yaroqsiz token)' });
  }
};

// --- AUTH ROUTING ---

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Login, parol va ismingizni kiriting' });
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return res.status(400).json({ error: 'Ushbu login band. Boshqa login tanlang' });
    }

    // Hash password securely with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: 'user', // default role
      },
    });

    // Generate signed JWT token
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        dailyTarget: user.dailyTarget,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ro\'yxatdan o\'tishda xatolik yuz berdi' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Login va parol kiritilmadi' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Login yoki parol xato!' });
    }

    // Generate signed JWT token
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        dailyTarget: user.dailyTarget,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Kirishda xatolik yuz berdi' });
  }
});

// POST /api/profile (Edit Profile and Account details)
app.post('/api/profile', authenticateUser, async (req, res) => {
  const { name, dailyTarget, username, password } = req.body;
  const user = req.body.user;

  try {
    const updateData: any = {
      name: name || user.name,
      dailyTarget: dailyTarget !== undefined ? dailyTarget : user.dailyTarget,
    };

    if (username && username !== user.username) {
      const existing = await prisma.user.findUnique({
        where: { username },
      });
      if (existing) {
        return res.status(400).json({ error: 'Ushbu login band. Boshqa login tanlang' });
      }
      updateData.username = username;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Re-issue signed JWT token with updated payload in case username/role changed
    const token = jwt.sign({ id: updated.id, username: updated.username, role: updated.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: updated.id,
        username: updated.username,
        name: updated.name,
        role: updated.role,
        dailyTarget: updated.dailyTarget,
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profilni tahrirlashda xatolik yuz berdi' });
  }
});

// --- ADMIN USERS CONTROLS ---

// GET /api/admin/users
app.get('/api/admin/users', authenticateUser, async (req, res) => {
  const adminUser = req.body.user;
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Ruxsat etilmagan bo\'lim' });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
    });

    const surahs = await prisma.surah.findMany();

    const result = [];
    for (const u of users) {
      if (u.role === 'admin') {
        result.push({
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          dailyTarget: u.dailyTarget,
          stats: null,
        });
        continue;
      }

      // Query their progress directly from the relational progresses table
      const progresses = await prisma.verseProgress.findMany({
        where: { userId: u.id }
      });
      const memorizedVerses = progresses.length;

      const progressMap: Record<number, number> = {};
      progresses.forEach((p) => {
        progressMap[p.surahId] = (progressMap[p.surahId] || 0) + 1;
      });

      let memorizedSurahs = 0;
      surahs.forEach((s) => {
        if (progressMap[s.id] === s.verseCount) {
          memorizedSurahs++;
        }
      });

      result.push({
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        dailyTarget: u.dailyTarget,
        stats: {
          memorizedSurahs,
          memorizedVerses,
        },
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Admin fetch users error:', error);
    res.status(500).json({ error: 'Foydalanuvchilarni yuklashda xatolik' });
  }
});

// POST /api/admin/users/:id/password
app.post('/api/admin/users/:id/password', authenticateUser, async (req, res) => {
  const adminUser = req.body.user;
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Ruxsat etilmagan bo\'lim' });
  }

  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'Yangi parol kiritilmadi' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        password: hashedPassword,
      },
    });

    res.json({ success: true, message: 'Foydalanuvchi paroli yangilandi' });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ error: 'Parolni o\'zgartirishda xatolik yuz berdi' });
  }
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', authenticateUser, async (req, res) => {
  const adminUser = req.body.user;
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Ruxsat etilmagan bo\'lim' });
  }

  const { id } = req.params;
  const userIdToDelete = parseInt(id);

  if (userIdToDelete === adminUser.id) {
    return res.status(400).json({ error: 'O\'zingizning akkauntingizni o\'chira olmaysiz' });
  }

  try {
    const userExists = await prisma.user.findUnique({
      where: { id: userIdToDelete }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    await prisma.user.delete({
      where: { id: userIdToDelete }
    });

    res.json({ success: true, message: 'Foydalanuvchi muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Foydalanuvchini o\'chirishda xatolik yuz berdi' });
  }
});

// --- CORE APIS ---

// GET /api/surahs
app.get('/api/surahs', authenticateUser, async (req, res) => {
  const user = req.body.user;
  try {
    const surahs = await prisma.surah.findMany({
      orderBy: { number: 'asc' },
    });

    // Fetch progress for this user
    const progresses = await prisma.verseProgress.findMany({
      where: { userId: user.id },
      select: { surahId: true },
    });

    const progressCountMap: Record<number, number> = {};
    progresses.forEach((p) => {
      progressCountMap[p.surahId] = (progressCountMap[p.surahId] || 0) + 1;
    });

    const result = surahs.map((surah) => {
      const memorizedCount = progressCountMap[surah.id] || 0;
      const isCompleted = memorizedCount === surah.verseCount && surah.verseCount > 0;
      return {
        id: surah.id,
        number: surah.number,
        name: surah.name,
        verseCount: surah.verseCount,
        juz: surah.juz,
        isCustom: surah.isCustom,
        memorizedCount,
        isCompleted,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching surahs:', error);
    res.status(500).json({ error: 'Failed to fetch surahs' });
  }
});

// GET /api/surahs/:id
app.get('/api/surahs/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.body.user;

  try {
    const surah = await prisma.surah.findUnique({
      where: { id: parseInt(id) },
    });

    if (!surah) {
      return res.status(404).json({ error: 'Surah not found' });
    }

    const progresses = await prisma.verseProgress.findMany({
      where: { userId: user.id, surahId: surah.id },
      select: { verseNumber: true },
    });
    const memorizedVerses = progresses.map((p) => p.verseNumber);

    res.json({
      id: surah.id,
      number: surah.number,
      name: surah.name,
      verseCount: surah.verseCount,
      juz: surah.juz,
      isCustom: surah.isCustom,
      memorizedVerses,
    });
  } catch (error) {
    console.error('Error fetching surah:', error);
    res.status(500).json({ error: 'Failed to fetch surah' });
  }
});

// POST /api/surahs (Create Surah Globally - Admin only)
app.post('/api/surahs', authenticateUser, async (req, res) => {
  const adminUser = req.body.user;
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Faqat Admin sura yarata oladi!' });
  }

  const { name, verseCount, number, juz } = req.body;

  if (!name || !verseCount) {
    return res.status(400).json({ error: 'Sura nomi va oyatlar soni kerak' });
  }

  try {
    let surahNumber = parseInt(number);
    if (isNaN(surahNumber)) {
      const maxSurah = await prisma.surah.findFirst({
        orderBy: { number: 'desc' },
      });
      surahNumber = maxSurah ? maxSurah.number + 1 : 1;
    }

    const existing = await prisma.surah.findUnique({
      where: { number: surahNumber },
    });

    if (existing) {
      return res.status(400).json({ error: `${surahNumber}-raqamli sura allaqachon mavjud` });
    }

    const newSurah = await prisma.surah.create({
      data: {
        name,
        verseCount: parseInt(verseCount),
        number: surahNumber,
        juz: parseInt(juz) || 30,
        isCustom: true,
      },
    });

    res.status(201).json(newSurah);
  } catch (error) {
    console.error('Error creating surah:', error);
    res.status(500).json({ error: 'Sura yaratishda xatolik' });
  }
});

// DELETE /api/surahs/:id (Delete Surah Globally - Admin only)
app.delete('/api/surahs/:id', authenticateUser, async (req, res) => {
  const adminUser = req.body.user;
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Ruxsat etilmagan amal' });
  }

  const { id } = req.params;
  try {
    await prisma.surah.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Sura o\'chirib tashlandi' });
  } catch (error) {
    console.error('Error deleting surah:', error);
    res.status(500).json({ error: 'Surani o\'chirishda xatolik yuz berdi' });
  }
});

// POST /api/progress (Toggle Single Verse)
app.post('/api/progress', authenticateUser, async (req, res) => {
  const { surahId, verseNumber, isMemorized } = req.body;
  const user = req.body.user;

  if (surahId === undefined || verseNumber === undefined || isMemorized === undefined) {
    return res.status(400).json({ error: 'surahId, verseNumber va isMemorized kiritilishi shart' });
  }

  try {
    const sId = parseInt(surahId);
    const vNum = parseInt(verseNumber);

    if (isMemorized) {
      await prisma.verseProgress.upsert({
        where: {
          userId_surahId_verseNumber: {
            userId: user.id,
            surahId: sId,
            verseNumber: vNum,
          },
        },
        update: { isMemorized: true },
        create: {
          userId: user.id,
          surahId: sId,
          verseNumber: vNum,
          isMemorized: true,
        },
      });
      await logActivity(user.id, 'verse', 1);
    } else {
      try {
        await prisma.verseProgress.delete({
          where: {
            userId_surahId_verseNumber: {
              userId: user.id,
              surahId: sId,
              verseNumber: vNum,
            },
          },
        });
        await logActivity(user.id, 'verse', -1);
      } catch (e) {
        // ignore
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Foydalanuvchi progressini yangilashda xato' });
  }
});

// POST /api/progress/bulk (Toggle All)
app.post('/api/progress/bulk', authenticateUser, async (req, res) => {
  const { surahId, isMemorized } = req.body;
  const user = req.body.user;

  if (surahId === undefined || isMemorized === undefined) {
    return res.status(400).json({ error: 'surahId va isMemorized kiritilishi shart' });
  }

  const sId = parseInt(surahId);
  try {
    if (isMemorized) {
      const surah = await prisma.surah.findUnique({
        where: { id: sId },
      });

      if (surah) {
        // Get count of already checked verses before deleting
        const existingCount = await prisma.verseProgress.count({
          where: { userId: user.id, surahId: sId }
        });
        const newlyCheckedCount = surah.verseCount - existingCount;

        await prisma.verseProgress.deleteMany({
          where: { userId: user.id, surahId: sId },
        });

        const data = Array.from({ length: surah.verseCount }, (_, i) => ({
          userId: user.id,
          surahId: sId,
          verseNumber: i + 1,
          isMemorized: true,
        }));

        await prisma.verseProgress.createMany({
          data,
        });

        if (newlyCheckedCount > 0) {
          await logActivity(user.id, 'verse', newlyCheckedCount);
        }
      }
    } else {
      // Get count of checked verses before deleting
      const currentCount = await prisma.verseProgress.count({
        where: { userId: user.id, surahId: sId }
      });

      await prisma.verseProgress.deleteMany({
        where: { userId: user.id, surahId: sId },
      });

      if (currentCount > 0) {
        await logActivity(user.id, 'verse', -currentCount);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating bulk progress:', error);
    res.status(500).json({ error: 'Bulk update error' });
  }
});

// --- DYNAMIC JUZ MAPPINGS FOR /api/stats ---
const juzStarts = [
  { juz: 1, surah: 1, verse: 1 },
  { juz: 2, surah: 2, verse: 142 },
  { juz: 3, surah: 2, verse: 253 },
  { juz: 4, surah: 3, verse: 93 },
  { juz: 5, surah: 4, verse: 24 },
  { juz: 6, surah: 4, verse: 148 },
  { juz: 7, surah: 5, verse: 82 },
  { juz: 8, surah: 6, verse: 111 },
  { juz: 9, surah: 7, verse: 88 },
  { juz: 10, surah: 8, verse: 41 },
  { juz: 11, surah: 9, verse: 93 },
  { juz: 12, surah: 11, verse: 6 },
  { juz: 13, surah: 12, verse: 53 },
  { juz: 14, surah: 15, verse: 1 },
  { juz: 15, surah: 17, verse: 1 },
  { juz: 16, surah: 18, verse: 75 },
  { juz: 17, surah: 21, verse: 1 },
  { juz: 18, surah: 23, verse: 1 },
  { juz: 19, surah: 25, verse: 21 },
  { juz: 20, surah: 27, verse: 56 },
  { juz: 21, surah: 29, verse: 46 },
  { juz: 22, surah: 33, verse: 31 },
  { juz: 23, surah: 36, verse: 28 },
  { juz: 24, surah: 39, verse: 32 },
  { juz: 25, surah: 41, verse: 47 },
  { juz: 26, surah: 46, verse: 1 },
  { juz: 27, surah: 51, verse: 31 },
  { juz: 28, surah: 58, verse: 1 },
  { juz: 29, surah: 67, verse: 1 },
  { juz: 30, surah: 78, verse: 1 },
];

function getJuzNumber(surahNum: number, verseNum: number): number {
  for (let i = juzStarts.length - 1; i >= 0; i--) {
    const start = juzStarts[i];
    if (surahNum > start.surah) {
      return start.juz;
    }
    if (surahNum === start.surah && verseNum >= start.verse) {
      return start.juz;
    }
  }
  return 30;
}

const standardJuzVerseCounts = [
  148, 111, 126, 131, 124, 110, 149, 142, 159, 127, 150, 170, 154, 227, 185, 269,
  190, 202, 339, 171, 178, 163, 357, 175, 188, 195, 399, 137, 431, 564,
];

// GET /api/stats
app.get('/api/stats', authenticateUser, async (req, res) => {
  const user = req.body.user;

  try {
    const surahs = await prisma.surah.findMany();
    const totalSurahs = surahs.length;
    let totalVerses = 0;
    surahs.forEach(s => totalVerses += s.verseCount);

    const progresses = await prisma.verseProgress.findMany({
      where: { userId: user.id }
    });

    const memorizedVersesCount = progresses.length;

    const progressCountMap: Record<number, number> = {};
    progresses.forEach((p) => {
      progressCountMap[p.surahId] = (progressCountMap[p.surahId] || 0) + 1;
    });

    let memorizedSurahs = 0;
    surahs.forEach((surah) => {
      const count = progressCountMap[surah.id] || 0;
      if (count === surah.verseCount && surah.verseCount > 0) {
        memorizedSurahs++;
      }
    });

    const juzMap: Record<number, { total: number; memorized: number }> = {};
    for (let i = 1; i <= 30; i++) {
      juzMap[i] = { total: standardJuzVerseCounts[i - 1], memorized: 0 };
    }

    const surahIdMap: Record<number, typeof surahs[0]> = {};
    surahs.forEach((s) => {
      surahIdMap[s.id] = s;
    });

    progresses.forEach((progress) => {
      const surah = surahIdMap[progress.surahId];
      if (surah) {
        const jNum = getJuzNumber(surah.number, progress.verseNumber);
        if (juzMap[jNum]) {
          juzMap[jNum].memorized++;
        }
      }
    });

    let memorizedJuzsCount = 0;
    const juzList = Object.keys(juzMap).map((juzKey) => {
      const juzNum = parseInt(juzKey);
      const data = juzMap[juzNum];
      const isCompleted = data.total > 0 && data.total === data.memorized;
      if (isCompleted) {
        memorizedJuzsCount++;
      }
      return {
        juzNumber: juzNum,
        totalVerses: data.total,
        memorizedVerses: data.memorized,
        isCompleted,
      };
    });

    res.json({
      totalSurahs,
      memorizedSurahs,
      totalVerses,
      memorizedVerses: memorizedVersesCount,
      totalJuzs: 30,
      memorizedJuzs: memorizedJuzsCount,
      juzs: juzList,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// --- TODO CRUD APIS ---

// GET /api/todos
app.get('/api/todos', authenticateUser, async (req, res) => {
  const user = req.body.user;
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: user.id },
      orderBy: { id: 'desc' }
    });
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST /api/todos
app.post('/api/todos', authenticateUser, async (req, res) => {
  const { text } = req.body;
  const user = req.body.user;

  if (!text) {
    return res.status(400).json({ error: 'Reja matni kiritilmadi' });
  }

  try {
    const todo = await prisma.todo.create({
      data: {
        userId: user.id,
        text,
        completed: false
      }
    });
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Rejani saqlashda xatolik' });
  }
});

// POST /api/todos/:id/toggle
app.post('/api/todos/:id/toggle', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.body.user;

  try {
    const todo = await prisma.todo.findFirst({
      where: { id: parseInt(id), userId: user.id }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Vazifa topilmadi' });
    }

    const updatedCompleted = !todo.completed;
    const updated = await prisma.todo.update({
      where: { id: todo.id },
      data: {
        completed: updatedCompleted,
        completedAt: updatedCompleted ? new Date() : null
      }
    });

    // Log activity
    await logActivity(user.id, 'todo', updatedCompleted ? 1 : -1);

    res.json(updated);
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ error: 'Vazifa holatini o\'zgartirishda xatolik' });
  }
});

// DELETE /api/todos/:id
app.delete('/api/todos/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.body.user;

  try {
    const todo = await prisma.todo.findFirst({
      where: { id: parseInt(id), userId: user.id }
    });

    if (!todo) {
      return res.status(404).json({ error: 'Vazifa topilmadi' });
    }

    if (todo.completed) {
      await logActivity(user.id, 'todo', -1);
    }

    await prisma.todo.delete({
      where: { id: todo.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Vazifani o\'chirishda xatolik' });
  }
});

// --- ACTIVITY LOG ENDPOINT ---

// GET /api/activities
app.get('/api/activities', authenticateUser, async (req, res) => {
  const user = req.body.user;
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: user.id },
      select: { date: true, count: true }
    });

    const dateCounts: Record<string, number> = {};
    logs.forEach((log) => {
      dateCounts[log.date] = (dateCounts[log.date] || 0) + log.count;
    });

    res.json(dateCounts);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Serve client static assets in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
