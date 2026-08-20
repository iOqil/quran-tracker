export interface Surah {
  id: number;
  number: number;
  name: string;
  verseCount: number;
  juz: number;
  isCustom: boolean;
  memorizedCount: number;
  isCompleted: boolean;
}

export interface SurahDetail {
  id: number;
  number: number;
  name: string;
  verseCount: number;
  juz: number;
  isCustom: boolean;
  memorizedVerses: number[];
}

export interface RepetitionSession {
  id: number;
  planId: number;
  dayNumber: number;
  date: string;
  time: string;
  status: "Bajarildi" | "Qoniqarli" | "O'tkazib yuborildi" | "Kutilmoqda";
}

export interface RepetitionPlan {
  id: number;
  surahId: number;
  surah: Surah;
  startDate: string;
  days: string;
  times: string;
  sessions: RepetitionSession[];
}

export interface Stats {
  totalSurahs: number;
  memorizedSurahs: number;
  totalVerses: number;
  memorizedVerses: number;
  totalJuzs: number;
  memorizedJuzs: number;
  juzs: { juzNumber: number; totalVerses: number; memorizedVerses: number; isCompleted: boolean }[];
}

export interface Reminder {
  id: number;
  time: string;
  name: string;
  isActive: boolean;
}

export interface UserSession {
  id: number;
  username: string;
  name: string;
  role: string;
  dailyTarget: string;
  token: string;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  completedAt?: string;
}

export interface AdminUserDetail {
  id: number;
  username: string;
  name: string;
  role: string;
  dailyTarget: string;
  stats: {
    memorizedSurahs: number;
    memorizedVerses: number;
  } | null;
}
