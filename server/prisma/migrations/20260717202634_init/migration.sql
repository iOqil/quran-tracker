-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "name" TEXT NOT NULL,
    "dailyTarget" TEXT NOT NULL DEFAULT '1 sura',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VerseProgress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "surahId" INTEGER NOT NULL,
    "verseNumber" INTEGER NOT NULL,
    "isMemorized" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_VerseProgress" ("createdAt", "id", "isMemorized", "surahId", "verseNumber") SELECT "createdAt", "id", "isMemorized", "surahId", "verseNumber" FROM "VerseProgress";
DROP TABLE "VerseProgress";
ALTER TABLE "new_VerseProgress" RENAME TO "VerseProgress";
CREATE UNIQUE INDEX "VerseProgress_surahId_verseNumber_key" ON "VerseProgress"("surahId", "verseNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
