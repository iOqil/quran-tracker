import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initCronJobs } from './push';

initCronJobs();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';

import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}


const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_production_secret_key_change_me_12984';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Initialize a single global Prisma Client instance (connects to MySQL via process.env.DATABASE_URL)
const prisma = new PrismaClient();

// Helper to safely parse integer route params
function parseId(value: string): number | null {
  const id = parseInt(value, 10);
  return isNaN(id) ? null : id;
}

// Valid repetition session statuses
const VALID_SESSION_STATUSES = ["Bajarildi", "Qoniqarli", "O'tkazib yuborildi", "Kutilmoqda"];

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

// Automatically create a default repetition plan when a Surah is fully memorized
async function autoCreateRepetitionPlan(userId: number, surahId: number, txClient?: any) {
  const client = txClient || prisma;
  
  const existingPlan = await client.repetitionPlan.findUnique({
    where: {
      userId_surahId: { userId, surahId }
    }
  });

  if (existingPlan) return;

  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const times = ["09:00"];
  const sDate = new Date();
  const baseDateString = sDate.toISOString().split('T')[0];

  const plan = await client.repetitionPlan.create({
    data: {
      userId,
      surahId,
      days: JSON.stringify(days),
      times: JSON.stringify(times),
      startDate: sDate
    }
  });

  const generatedSessions = [];
  const baseDateTime = new Date(baseDateString + 'T00:00:00Z');
  
  for (const day of days) {
    const targetDateObj = new Date(baseDateTime.getTime());
    targetDateObj.setUTCDate(targetDateObj.getUTCDate() + (day - 1));
    const targetDateStr = targetDateObj.toISOString().split('T')[0];
    
    for (const time of times) {
      generatedSessions.push({
        userId,
        planId: plan.id,
        dayNumber: day,
        date: targetDateStr,
        time,
        status: 'Kutilmoqda'
      });
    }
  }

  await client.repetitionSession.createMany({
    data: generatedSessions
  });
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

    req.user = user; // attach user details to request
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

    let isValid = false;
    if (user) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Run dummy compare to prevent timing side-channel user enumeration
      await bcrypt.compare(password, '$2a$10$6HkU3/Q0U5z063t9b0N.nOu3919v.B19P9/S9.G1.6/5/5/5/5/5/');
    }

    if (!user || !isValid) {
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
  const user = req.user;

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
  const adminUser = req.user;
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Ruxsat etilmagan bo\'lim' });
  }

  try {
    const users = await prisma.user.findMany({
      include: {
        progresses: true,
      },
      orderBy: { id: 'asc' },
    });

    const surahs = await prisma.surah.findMany();

    const result = users.map((u) => {
      if (u.role === 'admin') {
        return {
          id: u.id,
          username: u.username,
          name: u.name,
          role: u.role,
          dailyTarget: u.dailyTarget,
          stats: null,
        };
      }

      const memorizedVerses = u.progresses.length;
      const progressMap: Record<number, number> = {};
      u.progresses.forEach((p) => {
        progressMap[p.surahId] = (progressMap[p.surahId] || 0) + 1;
      });

      let memorizedSurahs = 0;
      surahs.forEach((s) => {
        if (progressMap[s.id] === s.verseCount) {
          memorizedSurahs++;
        }
      });

      return {
        id: u.id,
        username: u.username,
        name: u.name,
        role: u.role,
        dailyTarget: u.dailyTarget,
        stats: {
          memorizedSurahs,
          memorizedVerses,
        },
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Admin fetch users error:', error);
    res.status(500).json({ error: 'Foydalanuvchilarni yuklashda xatolik' });
  }
});

// POST /api/admin/users/:id/password
app.post('/api/admin/users/:id/password', authenticateUser, async (req, res) => {
  const adminUser = req.user;
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Ruxsat etilmagan bo\'lim' });
  }

  const userId = parseId(req.params.id);
  const { newPassword } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Noto\'g\'ri foydalanuvchi ID' });
  }

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Yangi parol kamida 4 ta belgidan iborat bo\'lishi kerak' });
  }

  try {
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
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
  const adminUser = req.user;
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Ruxsat etilmagan bo\'lim' });
  }

  const userIdToDelete = parseId(req.params.id);

  if (!userIdToDelete) {
    return res.status(400).json({ error: 'Noto\'g\'ri foydalanuvchi ID' });
  }

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
  const user = req.user;
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
  const surahId = parseId(req.params.id);
  const user = req.user;

  if (!surahId) {
    return res.status(400).json({ error: 'Noto\'g\'ri sura ID' });
  }

  try {
    const surah = await prisma.surah.findUnique({
      where: { id: surahId },
    });

    if (!surah) {
      return res.status(404).json({ error: 'Sura topilmadi' });
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
  const adminUser = req.user;
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Faqat Admin sura yarata oladi!' });
  }

  const { name, verseCount, number, juz } = req.body;

  if (!name || !verseCount) {
    return res.status(400).json({ error: 'Sura nomi va oyatlar soni kerak' });
  }

  const parsedVerseCount = parseInt(verseCount, 10);
  const parsedJuz = parseInt(juz, 10) || 30;

  if (isNaN(parsedVerseCount) || parsedVerseCount <= 0) {
    return res.status(400).json({ error: 'Oyatlar soni musbat son bo\'lishi kerak' });
  }

  if (parsedJuz < 1 || parsedJuz > 30) {
    return res.status(400).json({ error: 'Juz raqami 1 va 30 oralig\'ida bo\'lishi kerak' });
  }

  try {
    let surahNumber = parseInt(number, 10);
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
        verseCount: parsedVerseCount,
        number: surahNumber,
        juz: parsedJuz,
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
  const adminUser = req.user;
  if (adminUser.role !== 'admin') {
    return res.status(403).json({ error: 'Ruxsat etilmagan amal' });
  }

  const surahId = parseId(req.params.id);

  if (!surahId) {
    return res.status(400).json({ error: 'Noto\'g\'ri sura ID' });
  }

  try {
    const surahExists = await prisma.surah.findUnique({
      where: { id: surahId }
    });

    if (!surahExists) {
      return res.status(404).json({ error: 'Sura topilmadi' });
    }

    await prisma.surah.delete({
      where: { id: surahId },
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
  const user = req.user;

  if (surahId === undefined || verseNumber === undefined || isMemorized === undefined) {
    return res.status(400).json({ error: 'surahId, verseNumber va isMemorized kiritilishi shart' });
  }

  const sId = parseId(surahId.toString());
  const vNum = parseId(verseNumber.toString());

  if (!sId || !vNum) {
    return res.status(400).json({ error: 'Sura ID yoki oyat raqami noto\'g\'ri' });
  }

  try {
    const surah = await prisma.surah.findUnique({
      where: { id: sId },
    });

    if (!surah) {
      return res.status(404).json({ error: 'Sura topilmadi' });
    }

    if (vNum < 1 || vNum > surah.verseCount) {
      return res.status(400).json({ error: `Oyat raqami 1 va ${surah.verseCount} oralig'ida bo'lishi kerak` });
    }

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

      // Automatically create repetition plan if all verses are memorized
      const progressesCount = await prisma.verseProgress.count({
        where: { userId: user.id, surahId: sId }
      });
      if (progressesCount === surah.verseCount) {
        await autoCreateRepetitionPlan(user.id, sId);
      }
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
        // Safe to ignore if already deleted
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Foydalanuvchi progressini yangilashda xato yuz berdi' });
  }
});

// POST /api/progress/bulk (Toggle All)
app.post('/api/progress/bulk', authenticateUser, async (req, res) => {
  const { surahId, isMemorized } = req.body;
  const user = req.user;

  if (surahId === undefined || isMemorized === undefined) {
    return res.status(400).json({ error: 'surahId va isMemorized kiritilishi shart' });
  }

  const sId = parseId(surahId.toString());

  if (!sId) {
    return res.status(400).json({ error: 'Noto\'g\'ri sura ID' });
  }

  try {
    const surah = await prisma.surah.findUnique({
      where: { id: sId },
    });

    if (!surah) {
      return res.status(404).json({ error: 'Sura topilmadi' });
    }

    if (isMemorized) {
      // Run bulk insert atomically using transaction
      await prisma.$transaction(async (tx) => {
        const existingCount = await tx.verseProgress.count({
          where: { userId: user.id, surahId: sId }
        });
        const newlyCheckedCount = surah.verseCount - existingCount;

        await tx.verseProgress.deleteMany({
          where: { userId: user.id, surahId: sId },
        });

        const data = Array.from({ length: surah.verseCount }, (_, i) => ({
          userId: user.id,
          surahId: sId,
          verseNumber: i + 1,
          isMemorized: true,
        }));

        await tx.verseProgress.createMany({
          data,
        });

        if (newlyCheckedCount > 0) {
          await logActivity(user.id, 'verse', newlyCheckedCount);
        }

        await autoCreateRepetitionPlan(user.id, sId, tx);
      });
    } else {
      // Run bulk delete atomically using transaction
      await prisma.$transaction(async (tx) => {
        const currentCount = await tx.verseProgress.count({
          where: { userId: user.id, surahId: sId }
        });

        await tx.verseProgress.deleteMany({
          where: { userId: user.id, surahId: sId },
        });

        if (currentCount > 0) {
          await logActivity(user.id, 'verse', -currentCount);
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating bulk progress:', error);
    res.status(500).json({ error: 'Bulk yangilashda xatolik yuz berdi' });
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
  const user = req.user;

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
  const user = req.user;
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
  const user = req.user;

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
  const user = req.user;

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
  const user = req.user;

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
  const user = req.user;
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

// --- REPETITION PLAN ENDPOINTS ---

// GET /api/repetition/plans
app.get('/api/repetition/plans', authenticateUser, async (req, res) => {
  const user = req.user;
  try {
    const plans = await prisma.repetitionPlan.findMany({
      where: { userId: user.id },
      include: {
        surah: true,
        sessions: {
          orderBy: [
            { date: 'asc' },
            { time: 'asc' }
          ]
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(plans);
  } catch (error) {
    console.error('Error fetching repetition plans:', error);
    res.status(500).json({ error: 'Takrorlash rejalarini olishda xatolik' });
  }
});

// POST /api/repetition/plans
app.post('/api/repetition/plans', authenticateUser, async (req, res) => {
  const user = req.user;
  const { surahId, surahIds, days, times, startDate } = req.body;

  let idsToProcess: number[] = [];
  if (surahIds && Array.isArray(surahIds)) {
    idsToProcess = surahIds.map((id: any) => parseId(id?.toString() || '')).filter((id): id is number => id !== null);
  } else if (surahId) {
    const sId = parseId(surahId.toString());
    if (sId) idsToProcess.push(sId);
  }

  if (idsToProcess.length === 0 || !days || !Array.isArray(days) || !times || !Array.isArray(times)) {
    return res.status(400).json({ error: 'Noto\'g\'ri ma\'lumotlar yuborildi' });
  }

  try {
    const validSurahsCount = await prisma.surah.count({
      where: { id: { in: idsToProcess } }
    });

    if (validSurahsCount !== idsToProcess.length) {
      return res.status(404).json({ error: 'Ba\'zi suralar topilmadi' });
    }

    const sDate = startDate ? new Date(startDate) : new Date();
    const baseDateString = sDate.toISOString().split('T')[0];

    const updatedPlans = await prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const sId of idsToProcess) {
        // Find existing or create plan
        let plan = await tx.repetitionPlan.findUnique({
          where: {
            userId_surahId: { userId: user.id, surahId: sId }
          }
        });

        if (plan) {
          plan = await tx.repetitionPlan.update({
            where: { id: plan.id },
            data: {
              days: JSON.stringify(days),
              times: JSON.stringify(times),
              startDate: sDate
            }
          });
        } else {
          plan = await tx.repetitionPlan.create({
            data: {
              userId: user.id,
              surahId: sId,
              days: JSON.stringify(days),
              times: JSON.stringify(times),
              startDate: sDate
            }
          });
        }

        // Synchronize sessions using timezone-safe UTC arithmetic
        const generatedSessions: { dayNumber: number; date: string; time: string }[] = [];
        const baseDateTime = new Date(baseDateString + 'T00:00:00Z');
        
        for (const day of days) {
          const targetDateObj = new Date(baseDateTime.getTime());
          targetDateObj.setUTCDate(targetDateObj.getUTCDate() + (day - 1));
          const targetDateStr = targetDateObj.toISOString().split('T')[0];
          
          for (const time of times) {
            generatedSessions.push({
              dayNumber: day,
              date: targetDateStr,
              time: time
            });
          }
        }

        const existingSessions = await tx.repetitionSession.findMany({
          where: { planId: plan.id }
        });

        // Filter sessions to delete
        const sessionsToDelete = existingSessions.filter(session => {
          const isStillInSchedule = generatedSessions.some(gs => gs.date === session.date && gs.time === session.time);
          return !isStillInSchedule && session.status === 'Kutilmoqda';
        });

        if (sessionsToDelete.length > 0) {
          await tx.repetitionSession.deleteMany({
            where: {
              id: { in: sessionsToDelete.map(s => s.id) }
            }
          });
        }

        // Filter sessions to create
        const sessionsToCreate = generatedSessions.filter(gs => {
          return !existingSessions.some(es => es.date === gs.date && es.time === gs.time);
        });

        if (sessionsToCreate.length > 0) {
          await tx.repetitionSession.createMany({
            data: sessionsToCreate.map(gs => ({
              userId: user.id,
              planId: plan.id,
              dayNumber: gs.dayNumber,
              date: gs.date,
              time: gs.time,
              status: 'Kutilmoqda'
            }))
          });
        }

        // Return plan with sessions
        const updatedPlan = await tx.repetitionPlan.findUnique({
          where: { id: plan.id },
          include: {
            surah: true,
            sessions: {
              orderBy: [
                { date: 'asc' },
                { time: 'asc' }
              ]
            }
          }
        });
        results.push(updatedPlan);
      }
      return results;
    }, {
      timeout: 15000 // Multi-surah tx might need a bit more time
    });

    res.json(updatedPlans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// POST /api/repetition/sessions/:id/status
app.post('/api/repetition/sessions/:id/status', authenticateUser, async (req, res) => {
  const user = req.user;
  const sessionId = parseId(req.params.id);
  const { status } = req.body;

  if (!sessionId) return res.status(400).json({ error: 'Noto\'g\'ri session ID' });
  if (!status || !VALID_SESSION_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Noto\'g\'ri status. Ruxsat etilgan: ' + VALID_SESSION_STATUSES.join(', ') });
  }

  try {
    const session = await prisma.repetitionSession.findFirst({
      where: { id: sessionId, userId: user.id }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session topilmadi' });
    }

    const updated = await prisma.repetitionSession.update({
      where: { id: session.id },
      data: { status }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Statusni yangilashda xatolik' });
  }
});

// DELETE /api/repetition/plans/:id
app.delete('/api/repetition/plans/:id', authenticateUser, async (req, res) => {
  const user = req.user;
  const planId = parseId(req.params.id);

  if (!planId) return res.status(400).json({ error: 'Noto\'g\'ri plan ID' });

  try {
    const plan = await prisma.repetitionPlan.findFirst({
      where: { id: planId, userId: user.id }
    });

    if (!plan) return res.status(404).json({ error: 'Reja topilmadi' });

    await prisma.repetitionPlan.delete({ where: { id: plan.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Rejani o\'chirishda xatolik' });
  }
});


// --- PUSH NOTIFICATION ROUTES ---
app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', authenticateUser, async (req: any, res: any) => {
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

// Serve client static assets in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
