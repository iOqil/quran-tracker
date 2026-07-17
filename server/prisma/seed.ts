import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

const juz30Surahs = [
  { number: 78, name: "An-Naba", verseCount: 40, juz: 30 },
  { number: 79, name: "An-Nazi'at", verseCount: 46, juz: 30 },
  { number: 80, name: "'Abasa", verseCount: 42, juz: 30 },
  { number: 81, name: "At-Takwir", verseCount: 29, juz: 30 },
  { number: 82, name: "Al-Infitar", verseCount: 19, juz: 30 },
  { number: 83, name: "Al-Mutaffifin", verseCount: 36, juz: 30 },
  { number: 84, name: "Al-Inshiqaq", verseCount: 25, juz: 30 },
  { number: 85, name: "Al-Buruj", verseCount: 22, juz: 30 },
  { number: 86, name: "At-Tariq", verseCount: 17, juz: 30 },
  { number: 87, name: "Al-A'la", verseCount: 19, juz: 30 },
  { number: 88, name: "Al-Ghashiyah", verseCount: 26, juz: 30 },
  { number: 89, name: "Al-Fajr", verseCount: 30, juz: 30 },
  { number: 90, name: "Al-Balad", verseCount: 20, juz: 30 },
  { number: 91, name: "Ash-Shams", verseCount: 15, juz: 30 },
  { number: 92, name: "Al-Layl", verseCount: 21, juz: 30 },
  { number: 93, name: "Ad-Duha", verseCount: 11, juz: 30 },
  { number: 94, name: "Ash-Sharh", verseCount: 8, juz: 30 },
  { number: 95, name: "At-Tin", verseCount: 8, juz: 30 },
  { number: 96, name: "Al-Alaq", verseCount: 19, juz: 30 },
  { number: 97, name: "Al-Qadr", verseCount: 5, juz: 30 },
  { number: 98, name: "Al-Bayyinah", verseCount: 8, juz: 30 },
  { number: 99, name: "Az-Zalzalah", verseCount: 8, juz: 30 },
  { number: 100, name: "Al-Adiyat", verseCount: 11, juz: 30 },
  { number: 101, name: "Al-Qari'at", verseCount: 11, juz: 30 },
  { number: 102, name: "At-Takathur", verseCount: 8, juz: 30 },
  { number: 103, name: "Al-Asr", verseCount: 3, juz: 30 },
  { number: 104, name: "Al-Humazah", verseCount: 9, juz: 30 },
  { number: 105, name: "Al-Fil", verseCount: 5, juz: 30 },
  { number: 106, name: "Quraysh", verseCount: 4, juz: 30 },
  { number: 107, name: "Al-Ma'un", verseCount: 7, juz: 30 },
  { number: 108, name: "Al-Kawsar", verseCount: 3, juz: 30 },
  { number: 109, name: "Al-Kafirun", verseCount: 6, juz: 30 },
  { number: 110, name: "An-Nasr", verseCount: 3, juz: 30 },
  { number: 111, name: "Al-Masad", verseCount: 5, juz: 30 },
  { number: 112, name: "Al-Ikhlas", verseCount: 4, juz: 30 },
  { number: 113, name: "Al-Falaq", verseCount: 5, juz: 30 },
  { number: 114, name: "An-Nas", verseCount: 6, juz: 30 }
];

async function main() {
  console.log("Seeding initial data into MySQL database...");

  // Seed Surahs
  for (const surah of juz30Surahs) {
    await prisma.surah.upsert({
      where: { number: surah.number },
      update: {},
      create: {
        number: surah.number,
        name: surah.name,
        verseCount: surah.verseCount,
        juz: surah.juz,
        isCustom: false
      }
    });
  }

  // Seed Admin user
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashPassword('admin'),
      role: 'admin',
      name: 'Admin Boshqaruvchi',
      dailyTarget: '5 sura'
    }
  });

  // Seed Default Sevara user
  await prisma.user.upsert({
    where: { username: 'sevara' },
    update: {},
    create: {
      username: 'sevara',
      password: hashPassword('password123'),
      role: 'user',
      name: 'Sevara',
      dailyTarget: '1 sura'
    }
  });

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
