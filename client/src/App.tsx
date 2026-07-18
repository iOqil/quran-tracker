import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  BarChart2,
  Bell,
  User,
  Check,
  Trash,
  Download,
  Upload,
  ChevronLeft,
  Heart,
  Calendar,
  Award,
  TrendingUp,
  Sparkles,
  Search,
  Filter,
  KeyRound,
  LogOut,
  Users,
  CheckSquare
} from 'lucide-react';

// Reusable Circular Progress SVG Component
interface CircularProgressProps {
  percentage: number;
  value: number | string;
  total: number | string;
  label: string;
  color?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  value,
  total,
  label,
  color = '#E57399'
}) => {
  const radius = 28;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="stat-circle-box">
      <div className="circle-svg-wrapper">
        <svg width="70" height="70" viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="35"
            cy="35"
            r={radius}
            fill="transparent"
            stroke="#F3E5E9"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="35"
            cy="35"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        <div className="circle-label">
          <span className="circle-val">{value}</span>
          <span className="circle-desc">{label}</span>
        </div>
      </div>
      <div className="stat-title">
        {percentage.toFixed(0)}%
      </div>
      <div className="stat-subtitle">
        Jami: {total}
      </div>
    </div>
  );
};

// Interface definitions
interface Surah {
  id: number;
  number: number;
  name: string;
  verseCount: number;
  juz: number;
  isCustom: boolean;
  memorizedCount: number;
  isCompleted: boolean;
}

interface SurahDetail {
  id: number;
  number: number;
  name: string;
  verseCount: number;
  juz: number;
  isCustom: boolean;
  memorizedVerses: number[];
}

interface Stats {
  totalSurahs: number;
  memorizedSurahs: number;
  totalVerses: number;
  memorizedVerses: number;
  totalJuzs: number;
  memorizedJuzs: number;
  juzs: { juzNumber: number; totalVerses: number; memorizedVerses: number; isCompleted: boolean }[];
}

interface Reminder {
  id: number;
  time: string;
  name: string;
  isActive: boolean;
}

interface UserSession {
  id: number;
  username: string;
  name: string;
  role: string;
  dailyTarget: string;
  token: string;
}

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  completedAt?: string;
}

interface AdminUserDetail {
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

// Standard Quran Surah details for auto-fill helper
const quranSurahDictionary: Record<number, { name: string; verses: number; juz: number }> = {
  1: { name: "Al-Fatiha", verses: 7, juz: 1 },
  2: { name: "Al-Baqarah", verses: 286, juz: 1 },
  3: { name: "Al-Imran", verses: 200, juz: 3 },
  4: { name: "An-Nisa", verses: 176, juz: 4 },
  5: { name: "Al-Ma'idah", verses: 120, juz: 6 },
  6: { name: "Al-An'am", verses: 165, juz: 7 },
  7: { name: "Al-A'raf", verses: 206, juz: 8 },
  8: { name: "Al-Anfal", verses: 75, juz: 9 },
  9: { name: "At-Tawbah", verses: 129, juz: 10 },
  10: { name: "Yunus", verses: 109, juz: 11 },
  11: { name: "Hud", verses: 123, juz: 11 },
  12: { name: "Yusuf", verses: 111, juz: 12 },
  13: { name: "Ar-Ra'd", verses: 43, juz: 13 },
  14: { name: "Ibrahim", verses: 52, juz: 13 },
  15: { name: "Al-Hijr", verses: 99, juz: 14 },
  16: { name: "An-Nahl", verses: 128, juz: 14 },
  17: { name: "Al-Isra", verses: 111, juz: 15 },
  18: { name: "Al-Kahf", verses: 110, juz: 15 },
  19: { name: "Maryam", verses: 98, juz: 16 },
  20: { name: "Ta-Ha", verses: 135, juz: 16 },
  21: { name: "Al-Anbiya", verses: 112, juz: 17 },
  22: { name: "Al-Hajj", verses: 78, juz: 17 },
  23: { name: "Al-Mu'minun", verses: 118, juz: 18 },
  24: { name: "An-Nur", verses: 64, juz: 18 },
  25: { name: "Al-Furqan", verses: 77, juz: 18 },
  26: { name: "Ash-Shu'ara", verses: 227, juz: 19 },
  27: { name: "An-Naml", verses: 93, juz: 19 },
  28: { name: "Al-Qasas", verses: 88, juz: 20 },
  29: { name: "Al-Ankabut", verses: 69, juz: 20 },
  30: { name: "Ar-Rum", verses: 60, juz: 21 },
  31: { name: "Luqman", verses: 34, juz: 21 },
  32: { name: "As-Sajdah", verses: 30, juz: 21 },
  33: { name: "Al-Ahzab", verses: 73, juz: 21 },
  34: { name: "Saba", verses: 54, juz: 22 },
  35: { name: "Fatir", verses: 45, juz: 22 },
  36: { name: "Ya-Sin", verses: 83, juz: 22 },
  37: { name: "As-Saffat", verses: 182, juz: 23 },
  38: { name: "Sad", verses: 88, juz: 23 },
  39: { name: "Az-Zumar", verses: 75, juz: 23 },
  40: { name: "Ghafir", verses: 85, juz: 24 },
  41: { name: "Fussilat", verses: 54, juz: 24 },
  42: { name: "Ash-Shura", verses: 53, juz: 25 },
  43: { name: "Az-Zukhruf", verses: 89, juz: 25 },
  44: { name: "Ad-Dukhan", verses: 59, juz: 25 },
  45: { name: "Al-Jathiyah", verses: 37, juz: 25 },
  46: { name: "Al-Ahqaf", verses: 35, juz: 26 },
  47: { name: "Muhammad", verses: 38, juz: 26 },
  48: { name: "Al-Fath", verses: 29, juz: 26 },
  49: { name: "Al-Hujurat", verses: 18, juz: 26 },
  50: { name: "Qaf", verses: 45, juz: 26 },
  51: { name: "Adh-Dhariyat", verses: 60, juz: 26 },
  52: { name: "At-Tur", verses: 49, juz: 27 },
  53: { name: "An-Najm", verses: 62, juz: 27 },
  54: { name: "Al-Qamar", verses: 55, juz: 27 },
  55: { name: "Ar-Rahman", verses: 78, juz: 27 },
  56: { name: "Al-Waqi'ah", verses: 96, juz: 27 },
  57: { name: "Al-Hadid", verses: 29, juz: 27 },
  58: { name: "Al-Mujadilah", verses: 22, juz: 28 },
  59: { name: "Al-Hashr", verses: 24, juz: 28 },
  60: { name: "Al-Mumtahanah", verses: 13, juz: 28 },
  61: { name: "As-Saff", verses: 14, juz: 28 },
  62: { name: "Al-Jumu'ah", verses: 11, juz: 28 },
  63: { name: "Al-Munafiqun", verses: 11, juz: 28 },
  64: { name: "At-Taghabun", verses: 18, juz: 28 },
  65: { name: "At-Talaq", verses: 12, juz: 28 },
  66: { name: "At-Tahrim", verses: 12, juz: 28 },
  67: { name: "Al-Mulk", verses: 30, juz: 29 },
  68: { name: "Al-Qalam", verses: 52, juz: 29 },
  69: { name: "Al-Haqqah", verses: 52, juz: 29 },
  70: { name: "Al-Ma'arij", verses: 44, juz: 29 },
  71: { name: "Nuh", verses: 28, juz: 29 },
  72: { name: "Al-Jinn", verses: 28, juz: 29 },
  73: { name: "Al-Muzzammil", verses: 20, juz: 29 },
  74: { name: "Al-Muddaththir", verses: 56, juz: 29 },
  75: { name: "Al-Qiyamah", verses: 40, juz: 29 },
  76: { name: "Al-Insan", verses: 31, juz: 29 },
  77: { name: "Al-Mursalat", verses: 50, juz: 29 },
  78: { name: "An-Naba", verses: 40, juz: 30 },
  79: { name: "An-Nazi'at", verses: 46, juz: 30 },
  80: { name: "'Abasa", verses: 42, juz: 30 },
  81: { name: "At-Takwir", verses: 29, juz: 30 },
  82: { name: "Al-Infitar", verses: 19, juz: 30 },
  83: { name: "Al-Mutaffifin", verses: 36, juz: 30 },
  84: { name: "Al-Inshiqaq", verses: 25, juz: 30 },
  85: { name: "Al-Buruj", verses: 22, juz: 30 },
  86: { name: "At-Tariq", verses: 17, juz: 30 },
  87: { name: "Al-A'la", verses: 19, juz: 30 },
  88: { name: "Al-Ghashiyah", verses: 26, juz: 30 },
  89: { name: "Al-Fajr", verses: 30, juz: 30 },
  90: { name: "Al-Balad", verses: 20, juz: 30 },
  91: { name: "Ash-Shams", verses: 15, juz: 30 },
  92: { name: "Al-Layl", verses: 21, juz: 30 },
  93: { name: "Ad-Duha", verses: 11, juz: 30 },
  94: { name: "Ash-Sharh", verses: 8, juz: 30 },
  95: { name: "At-Tin", verses: 8, juz: 30 },
  96: { name: "Al-Alaq", verses: 19, juz: 30 },
  97: { name: "Al-Qadr", verses: 5, juz: 30 },
  98: { name: "Al-Bayyinah", verses: 8, juz: 30 },
  99: { name: "Az-Zalzalah", verses: 8, juz: 30 },
  100: { name: "Al-Adiyat", verses: 11, juz: 30 },
  101: { name: "Al-Qari'ah", verses: 11, juz: 30 },
  102: { name: "At-Takathur", verses: 8, juz: 30 },
  103: { name: "Al-Asr", verses: 3, juz: 30 },
  104: { name: "Al-Humazah", verses: 9, juz: 30 },
  105: { name: "Al-Fil", verses: 5, juz: 30 },
  106: { name: "Quraysh", verses: 4, juz: 30 },
  107: { name: "Al-Ma'un", verses: 7, juz: 30 },
  108: { name: "Al-Kawsar", verses: 3, juz: 30 },
  109: { name: "Al-Kafirun", verses: 6, juz: 30 },
  110: { name: "An-Nasr", verses: 3, juz: 30 },
  111: { name: "Al-Masad", verses: 5, juz: 30 },
  112: { name: "Al-Ikhlas", verses: 4, juz: 30 },
  113: { name: "Al-Falaq", verses: 5, juz: 30 },
  114: { name: "An-Nas", verses: 6, juz: 30 }
};

function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth inputs
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');

  // Core application states
  const [activeTab, setActiveTab] = useState<'list' | 'todos' | 'stats' | 'reminders' | 'profile' | 'users'>('list');
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<'all' | 'memorized' | 'remaining'>('all');
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [juzFilter, setJuzFilter] = useState<string>('all');

  // Admin states
  const [adminMode, setAdminMode] = useState<boolean>(false);
  const [adminName, setAdminName] = useState('');
  const [adminVerses, setAdminVerses] = useState('');
  const [adminNumber, setAdminNumber] = useState('');
  const [adminJuz, setAdminJuz] = useState('30');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Admin User controls
  const [adminUsers, setAdminUsers] = useState<AdminUserDetail[]>([]);
  const [resetUser, setResetUser] = useState<AdminUserDetail | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  // Profile Edit states
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileTarget, setProfileTarget] = useState('1 sura');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [newReminderName, setNewReminderName] = useState('');
  const [repChecks, setRepChecks] = useState<Record<number, Record<string, boolean>>>({});

  // Todo & Heatmap states
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [activities, setActivities] = useState<Record<string, number>>({});
  const [todoLoading, setTodoLoading] = useState(false);

  const [lastStudied, setLastStudied] = useState<{ name: string; time: string } | null>(null);

  // Initialize and check user session from LocalStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      const user = JSON.parse(savedSession);
      setCurrentUser(user);
      setProfileName(user.name);
      setProfileUsername(user.username);
      setProfileTarget(user.dailyTarget);

      // Load custom reminders
      const savedReminders = localStorage.getItem(`userReminders_${user.id}`);
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      } else {
        const defaultReminders = [
          { id: 1, time: '08:00', name: 'Bomdoddan keyin yodlash', isActive: true },
          { id: 2, time: '14:00', name: 'Pauza vaqtida yodlash', isActive: false },
          { id: 3, time: '20:30', name: 'Isha namozidan keyin yodlash', isActive: true },
          { id: 4, time: '22:00', name: 'Yotishdan oldin takrorlash', isActive: false },
        ];
        setReminders(defaultReminders);
        localStorage.setItem(`userReminders_${user.id}`, JSON.stringify(defaultReminders));
      }

      // Load repetition checks
      const savedChecks = localStorage.getItem(`repetitionChecks_${user.id}`);
      if (savedChecks) {
        setRepChecks(JSON.parse(savedChecks));
      } else {
        setRepChecks({});
      }
    }
  }, []);

  // Fetch application data
  const fetchData = async (user?: UserSession) => {
    const activeUser = user || currentUser;
    if (!activeUser) return;

    try {
      const headers = { 'Authorization': `Bearer ${activeUser.token}` };
      
      const surahsRes = await fetch('/api/surahs', { headers });
      const surahsData = await surahsRes.json();
      setSurahs(surahsData);

      const statsRes = await fetch('/api/stats', { headers });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch users list for Admin tab
      if (activeUser.role === 'admin') {
        const usersRes = await fetch('/api/admin/users', { headers });
        const usersData = await usersRes.json();
        setAdminUsers(usersData);
      }

      // Fetch Todos & Activities
      await fetchTodos(activeUser);
      await fetchActivities(activeUser);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      const savedLastStudied = localStorage.getItem(`lastStudied_${currentUser.id}`);
      if (savedLastStudied) {
        setLastStudied(JSON.parse(savedLastStudied));
      } else {
        setLastStudied(null);
      }
    }
  }, [currentUser, activeTab]);

  // AUTO-FILL Admin Form based on Surah Number
  useEffect(() => {
    const sNum = parseInt(adminNumber);
    if (!isNaN(sNum) && quranSurahDictionary[sNum]) {
      const dictVal = quranSurahDictionary[sNum];
      setAdminName(dictVal.name);
      setAdminVerses(dictVal.verses.toString());
      setAdminJuz(dictVal.juz.toString());
    }
  }, [adminNumber]);

  // Auth: Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authUsername || !authPassword) {
      setAuthError('Login va parolni kiriting!');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Kirishda xatolik yuz berdi');
        return;
      }

      const session = { token: data.token, ...data.user };
      localStorage.setItem('userSession', JSON.stringify(session));
      setCurrentUser(session);
      setProfileName(data.user.name);
      setProfileUsername(data.user.username);
      setProfilePassword('');
      setProfileTarget(data.user.dailyTarget);
      setAuthUsername('');
      setAuthPassword('');

      // Load specific reminders & checks
      const savedReminders = localStorage.getItem(`userReminders_${data.id}`);
      if (savedReminders) {
        setReminders(JSON.parse(savedReminders));
      } else {
        const defaultReminders = [
          { id: 1, time: '08:00', name: 'Bomdoddan keyin yodlash', isActive: true },
          { id: 2, time: '14:00', name: 'Pauza vaqtida yodlash', isActive: false },
          { id: 3, time: '20:30', name: 'Isha namozidan keyin yodlash', isActive: true },
          { id: 4, time: '22:00', name: 'Yotishdan oldin takrorlash', isActive: false },
        ];
        setReminders(defaultReminders);
        localStorage.setItem(`userReminders_${data.id}`, JSON.stringify(defaultReminders));
      }
      const savedChecks = localStorage.getItem(`repetitionChecks_${data.id}`);
      setRepChecks(savedChecks ? JSON.parse(savedChecks) : {});

      fetchData(data);
    } catch (error) {
      setAuthError('Serverga ulanib bo\'lmadi');
    }
  };

  // Auth: Register handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authUsername || !authPassword || !authName) {
      setAuthError('Barcha maydonlarni to\'ldiring!');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword,
          name: authName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Ro\'yxatdan o\'tishda xatolik');
        return;
      }

      const session = { token: data.token, ...data.user };
      localStorage.setItem('userSession', JSON.stringify(session));
      setCurrentUser(session);
      setProfileName(data.user.name);
      setProfileUsername(data.user.username);
      setProfilePassword('');
      setProfileTarget(data.user.dailyTarget);
      setAuthUsername('');
      setAuthPassword('');
      setAuthName('');

      // Load specific reminders & checks for registered user
      const defaultReminders = [
        { id: 1, time: '08:00', name: 'Bomdoddan keyin yodlash', isActive: true },
        { id: 2, time: '14:00', name: 'Pauza vaqtida yodlash', isActive: false },
        { id: 3, time: '20:30', name: 'Isha namozidan keyin yodlash', isActive: true },
        { id: 4, time: '22:00', name: 'Yotishdan oldin takrorlash', isActive: false },
      ];
      setReminders(defaultReminders);
      localStorage.setItem(`userReminders_${data.id}`, JSON.stringify(defaultReminders));
      setRepChecks({});
      localStorage.setItem(`repetitionChecks_${data.id}`, JSON.stringify({}));

      fetchData(data);
    } catch (error) {
      setAuthError('Serverga ulanib bo\'lmadi');
    }
  };

  // Auth: Logout handler
  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setCurrentUser(null);
    setAdminMode(false);
    setActiveTab('list');
  };

  // Profile update handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    if (!currentUser) return;

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileName,
          dailyTarget: profileTarget,
          username: profileUsername,
          password: profilePassword || undefined
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'Profilni saqlashda xato');
        return;
      }

      const session = { token: data.token, ...data.user };
      localStorage.setItem('userSession', JSON.stringify(session));
      setCurrentUser(session);
      setProfileUsername(data.user.username);
      setProfilePassword('');
      setProfileSuccess('Profil muvaffaqiyatli saqlandi!');
      fetchData(session);
    } catch (error) {
      setProfileError('Server bilan ulanish xatosi');
    }
  };

  // Admin User: Reset password handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (!currentUser || !resetUser) return;

    try {
      const res = await fetch(`/api/admin/users/${resetUser.id}/password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: resetPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Parolni o\'zgartirib bo\'lmadi');
        return;
      }

      setResetSuccess(`${resetUser.name} paroli yangilandi!`);
      setResetPassword('');
      setTimeout(() => setResetUser(null), 1500);
    } catch (error) {
      setResetError('Ulanish xatosi');
    }
  };

  // Fetch single surah detail
  const handleOpenSurah = async (id: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/surahs/${id}`, {
        headers: { 'Authorization': `Bearer ${currentUser.token}` },
      });
      const data = await res.json();
      setSelectedSurah(data);
    } catch (error) {
      console.error('Error loading surah details:', error);
    }
  };

  // Toggle single verse (Optimistic UI Update)
  const handleToggleVerse = async (verseNumber: number, isChecked: boolean) => {
    if (!selectedSurah || !currentUser) return;
    
    const previousVerses = selectedSurah.memorizedVerses;
    const previousSurahs = surahs;

    const updatedVerses = isChecked
      ? [...selectedSurah.memorizedVerses, verseNumber]
      : selectedSurah.memorizedVerses.filter((v) => v !== verseNumber);

    setSelectedSurah({
      ...selectedSurah,
      memorizedVerses: updatedVerses,
    });

    setSurahs((prevSurahs) =>
      prevSurahs.map((s) =>
        s.id === selectedSurah.id
          ? {
              ...s,
              memorizedCount: updatedVerses.length,
              isCompleted: updatedVerses.length === s.verseCount,
            }
          : s
      )
    );

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surahId: selectedSurah.id,
          verseNumber,
          isMemorized: isChecked,
        }),
      });

      if (!res.ok) throw new Error('API server returned error');

      const studyInfo = {
        name: `${selectedSurah.name} (${selectedSurah.verseCount}-oyat)`,
        time: new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
      };
      setLastStudied(studyInfo);
      localStorage.setItem(`lastStudied_${currentUser.id}`, JSON.stringify(studyInfo));

      const statsRes = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${currentUser.token}` },
      });
      const statsData = await statsRes.json();
      setStats(statsData);
      fetchActivities();
    } catch (error) {
      setSelectedSurah({
        ...selectedSurah,
        memorizedVerses: previousVerses,
      });
      setSurahs(previousSurahs);
    }
  };

  // Toggle Bulk (Optimistic UI Update)
  const handleToggleBulk = async (isCheckAll: boolean) => {
    if (!selectedSurah || !currentUser) return;
    
    const previousVerses = selectedSurah.memorizedVerses;
    const previousSurahs = surahs;

    const updatedVerses = isCheckAll
      ? Array.from({ length: selectedSurah.verseCount }, (_, i) => i + 1)
      : [];

    setSelectedSurah({
      ...selectedSurah,
      memorizedVerses: updatedVerses,
    });

    setSurahs((prevSurahs) =>
      prevSurahs.map((s) =>
        s.id === selectedSurah.id
          ? {
              ...s,
              memorizedCount: updatedVerses.length,
              isCompleted: isCheckAll,
            }
          : s
      )
    );

    try {
      const res = await fetch('/api/progress/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surahId: selectedSurah.id,
          isMemorized: isCheckAll,
        }),
      });

      if (!res.ok) throw new Error('Bulk toggle failed');

      const studyInfo = {
        name: `${selectedSurah.name} (${selectedSurah.verseCount}-oyat)`,
        time: new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
      };
      setLastStudied(studyInfo);
      localStorage.setItem(`lastStudied_${currentUser.id}`, JSON.stringify(studyInfo));

      const statsRes = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${currentUser.token}` },
      });
      const statsData = await statsRes.json();
      setStats(statsData);
      fetchActivities();
    } catch (error) {
      setSelectedSurah({
        ...selectedSurah,
        memorizedVerses: previousVerses,
      });
      setSurahs(previousSurahs);
    }
  };

  // Create Surah Globally (Admin)
  const handleCreateSurah = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!currentUser) return;

    if (!adminName || !adminVerses) {
      setFormError("Sura nomi va oyatlar sonini kiriting!");
      return;
    }

    try {
      const res = await fetch('/api/surahs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: adminName,
          verseCount: parseInt(adminVerses),
          number: adminNumber ? parseInt(adminNumber) : undefined,
          juz: parseInt(adminJuz),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Xatolik yuz berdi');
        return;
      }

      setFormSuccess(`${data.name} surasi muvaffaqiyatli yaratildi!`);
      setAdminName('');
      setAdminVerses('');
      setAdminNumber('');
      setAdminJuz('30');
      fetchData();
    } catch (error) {
      setFormError('Server bilan aloqa xatosi');
    }
  };

  // Delete Surah Globally (Admin)
  const handleDeleteSurah = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Haqiqatan ham bu surani butunlay o'chirib tashlamoqchimisiz?")) return;
    if (!currentUser) return;

    try {
      await fetch(`/api/surahs/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${currentUser.token}` },
        });
      fetchData();
    } catch (error) {
      console.error('Error deleting surah:', error);
    }
  };

  // Toggle reminder switches
  const handleToggleReminder = (id: number) => {
    if (!currentUser) return;
    const updated = reminders.map((rem) =>
      rem.id === id ? { ...rem, isActive: !rem.isActive } : rem
    );
    setReminders(updated);
    localStorage.setItem(`userReminders_${currentUser.id}`, JSON.stringify(updated));
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderName || !currentUser) return;
    const newRem: Reminder = {
      id: Date.now(),
      time: newReminderTime,
      name: newReminderName,
      isActive: true
    };
    const updated = [...reminders, newRem];
    setReminders(updated);
    localStorage.setItem(`userReminders_${currentUser.id}`, JSON.stringify(updated));
    setNewReminderName('');
  };

  const handleDeleteReminder = (id: number) => {
    if (!currentUser) return;
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    localStorage.setItem(`userReminders_${currentUser.id}`, JSON.stringify(updated));
  };

  const handleToggleRepCheck = (surahId: number, dayKey: string) => {
    if (!currentUser) return;
    const currentSurahChecks = repChecks[surahId] || {};
    const updatedChecks = {
      ...repChecks,
      [surahId]: {
        ...currentSurahChecks,
        [dayKey]: !currentSurahChecks[dayKey]
      }
    };
    setRepChecks(updatedChecks);
    localStorage.setItem(`repetitionChecks_${currentUser.id}`, JSON.stringify(updatedChecks));
  };

  // Todo & Activity fetches and CRUD
  const fetchTodos = async (user?: UserSession) => {
    const activeUser = user || currentUser;
    if (!activeUser) return;
    try {
      const headers = { 'Authorization': `Bearer ${activeUser.token}` };
      const res = await fetch('/api/todos', { headers });
      const data = await res.json();
      if (Array.isArray(data)) setTodos(data);
    } catch (e) {
      console.error('Error fetching todos:', e);
    }
  };

  const fetchActivities = async (user?: UserSession) => {
    const activeUser = user || currentUser;
    if (!activeUser) return;
    try {
      const headers = { 'Authorization': `Bearer ${activeUser.token}` };
      const res = await fetch('/api/activities', { headers });
      const data = await res.json();
      if (data) setActivities(data);
    } catch (e) {
      console.error('Error fetching activities:', e);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim() || !currentUser) return;
    setTodoLoading(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newTodoText })
      });
      const data = await res.json();
      if (res.ok) {
        setTodos([data, ...todos]);
        setNewTodoText('');
        fetchActivities();
      }
    } catch (err) {
      console.error('Error adding todo:', err);
    } finally {
      setTodoLoading(false);
    }
  };

  const handleToggleTodo = async (id: number) => {
    if (!currentUser) return;
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    try {
      const res = await fetch(`/api/todos/${id}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        fetchActivities();
      } else {
        fetchTodos();
      }
    } catch (err) {
      console.error('Error toggling todo:', err);
      fetchTodos();
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!currentUser) return;
    setTodos(todos.filter(t => t.id !== id));
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        fetchActivities();
      } else {
        fetchTodos();
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
      fetchTodos();
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!currentUser) return;
    const confirmDelete = window.confirm(`${userName} akkauntini o'chirishni tasdiqlaysizmi? Barcha yodlangan oyatlar va natijalar butunlay o'chib ketadi!`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Foydalanuvchi o\'chirildi');
        setAdminUsers(adminUsers.filter(u => u.id !== userId));
      } else {
        alert(data.error || 'O\'chirishda xatolik yuz berdi');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Foydalanuvchini o\'chirishda xatolik yuz berdi');
    }
  };

  // Generate GitHub-style Heatmap Grid
  const renderHeatmap = () => {
    const dates: { dateStr: string; count: number; dayOfWeek: number }[] = [];
    const today = new Date();
    
    const startDay = new Date();
    startDay.setDate(today.getDate() - 364);
    
    const dayOfWeek = startDay.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDay.setDate(startDay.getDate() - diffToMonday);

    for (let i = 0; i < 371; i++) {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      
      const tzOffset = d.getTimezoneOffset() * 60000;
      const dateStr = new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
      const count = activities[dateStr] || 0;
      
      dates.push({
        dateStr,
        count,
        dayOfWeek: d.getDay()
      });
    }

    const rows: typeof dates[] = Array.from({ length: 7 }, () => []);
    
    dates.forEach((item) => {
      const rowIndex = item.dayOfWeek === 0 ? 6 : item.dayOfWeek - 1;
      rows[rowIndex].push(item);
    });

    return (
      <div className="heatmap-wrapper" style={{ marginBottom: '24px' }}>
        <div className="heatmap-header">
          <span className="heatmap-title">📊 Kunlik Faollik Kalendari</span>
          <div className="heatmap-legend">
            <span>Kam</span>
            <div className="legend-cell level-0"></div>
            <div className="legend-cell level-1"></div>
            <div className="legend-cell level-2"></div>
            <div className="legend-cell level-3"></div>
            <div className="legend-cell level-4"></div>
            <span>Ko'p</span>
          </div>
        </div>
        
        <div className="heatmap-scroll-container">
          <div className="heatmap-grid">
            <div className="heatmap-labels">
              <span>Du</span>
              <span>Ch</span>
              <span>Ju</span>
              <span>Ya</span>
            </div>
            
            <div className="heatmap-days-container">
              {rows.map((row, rIndex) => (
                <div key={rIndex} className="heatmap-row">
                  {row.map((day) => {
                    let level = 'level-0';
                    if (day.count > 0 && day.count <= 2) level = 'level-1';
                    else if (day.count > 2 && day.count <= 4) level = 'level-2';
                    else if (day.count > 4 && day.count <= 7) level = 'level-3';
                    else if (day.count > 7) level = 'level-4';

                    const formattedDate = new Date(day.dateStr).toLocaleDateString('uz-UZ', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });

                    return (
                      <div
                        key={day.dateStr}
                        className={`heatmap-cell ${level}`}
                        title={`${formattedDate}: ${day.count} ta harakat`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTodoList = () => {
    return (
      <div className="todo-widget-card">
        <h3 className="todo-widget-title">📌 Kunlik Vazifalar (Reja)</h3>
        
        <form onSubmit={handleAddTodo} className="todo-input-form">
          <input
            type="text"
            className="admin-input todo-input"
            placeholder="Yangi vazifa..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            disabled={todoLoading}
            required
          />
          <button type="submit" className="admin-submit-btn todo-add-btn" disabled={todoLoading} style={{ marginTop: 0 }}>
            Qo'shish
          </button>
        </form>

        <div className="todo-list-scroll" style={{ maxHeight: 'none', overflowY: 'visible' }}>
          {todos.length > 0 ? (
            <div className="todo-items-list">
              {todos.map((todo) => (
                <div key={todo.id} className={`todo-item-row ${todo.completed ? 'completed' : ''}`}>
                  <label className="todo-checkbox-label">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id)}
                    />
                    <span className="todo-text">{todo.text}</span>
                  </label>
                  <button
                    className="admin-delete-btn"
                    style={{ padding: '6px', border: 'none', color: '#DC2626', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => handleDeleteTodo(todo.id)}
                    title="Vazifani o'chirish"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="todo-empty-text">Kunlik vazifalar ro'yxati bo'sh. Rejalar qo'shish uchun yuqoridagi maydondan foydalaning.</p>
          )}
        </div>
      </div>
    );
  };

  // Backup Export
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(surahs));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `quran_tracker_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Backup Import
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const importedSurahs = JSON.parse(event.target?.result as string) as Surah[];
          if (!Array.isArray(importedSurahs)) {
            alert("Noto'g'ri fayl formati!");
            return;
          }

          let importCount = 0;
          for (const s of importedSurahs) {
            const existing = surahs.find((sur) => sur.number === s.number);
            let sId = existing?.id;

            if (!existing && currentUser.role === 'admin') {
              const res = await fetch('/api/surahs', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${currentUser.token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: s.name,
                  verseCount: s.verseCount,
                  number: s.number,
                  juz: s.juz,
                }),
              });
              const newS = await res.json();
              sId = newS.id;
            }

            if (sId) {
              if (s.memorizedCount > 0) {
                await fetch('/api/progress/bulk', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    surahId: sId,
                    isMemorized: s.memorizedCount === s.verseCount,
                  }),
                });
              }
              importCount++;
            }
          }

          alert(`Muvaffaqiyatli tiklandi! ${importCount} ta sura yuklandi.`);
          fetchData();
        } catch (err) {
          alert("Faylni o'qishda xatolik yuz berdi!");
        }
      };
    }
  };

  // Filter surahs
  const filteredSurahs = surahs.filter((surah) => {
    const matchesSearch =
      surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.number.toString() === searchQuery;
    if (!matchesSearch) return false;

    if (juzFilter !== 'all' && surah.juz.toString() !== juzFilter) return false;

    if (filter === 'memorized') return surah.isCompleted;
    if (filter === 'remaining') return !surah.isCompleted;
    return true;
  });

  const surahsPercent = stats ? (stats.memorizedSurahs / (stats.totalSurahs || 1)) * 100 : 0;
  const versesPercent = stats ? (stats.memorizedVerses / (stats.totalVerses || 1)) * 100 : 0;
  const juzPercent = stats ? (stats.memorizedJuzs / 30) * 100 : 0;

  // Render Login/Register Screen
  if (!currentUser) {
    return (
      <div className="auth-overlay">
        <div className="auth-card">
          <div className="auth-logo">
            <Heart size={28} fill="var(--primary-dark)" color="var(--primary-dark)" />
            <h2>QuranTracker</h2>
            <p className="auth-logo-sub">Yodlash statistikasini hisoblash tizimi</p>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="admin-form-layout">
            {authMode === 'register' && (
              <div className="admin-form-group">
                <label>Ismingiz (Ism Familiya)</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Masalan: Sevara"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                />
              </div>
            )}

            <div className="admin-form-group">
              <label>Foydalanuvchi logini (Username)</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Kirish logini"
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label>Tizim paroli (Password)</label>
              <input
                type="password"
                className="admin-input"
                placeholder="Maxfiy kod"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>

            {authError && <p className="form-error-msg">{authError}</p>}

            <button type="submit" className="admin-submit-btn">
              {authMode === 'login' ? 'Tizimga Kirish' : 'Ro\'yxatdan O\'tish'}
            </button>
          </form>



          <div className="auth-footer-toggle">
            {authMode === 'login' ? (
              <p>
                Akkauntingiz yo'qmi?{' '}
                <span onClick={() => { setAuthMode('register'); setAuthError(''); }}>Ro'yxatdan o'ting</span>
              </p>
            ) : (
              <p>
                Akkauntingiz bormi?{' '}
                <span onClick={() => { setAuthMode('login'); setAuthError(''); }}>Tizimga kiring</span>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation - Desktop only */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <Heart size={22} fill="var(--primary-dark)" color="var(--primary-dark)" />
          <span>QuranTracker</span>
        </div>
        
        <div className="sidebar-profile">
          <div className="sidebar-avatar">{currentUser.name.slice(0,1).toUpperCase()}</div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{currentUser.name}</span>
            <span className="sidebar-profile-status">{currentUser.role === 'admin' ? 'Tizim Admini' : 'Yodlovchi'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <BookOpen size={18} />
            Jadval
          </button>
          <button
            className={`sidebar-nav-item ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            <CheckSquare size={18} />
            Kunlik Reja
          </button>
          <button
            className={`sidebar-nav-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart2 size={18} />
            Statistika
          </button>
          <button
            className={`sidebar-nav-item ${activeTab === 'reminders' ? 'active' : ''}`}
            onClick={() => setActiveTab('reminders')}
          >
            <Bell size={18} />
            Eslatmalar
          </button>
          <button
            className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Profil
          </button>
          {currentUser.role === 'admin' && (
            <button
              className={`sidebar-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={18} />
              Foydalanuvchilar
            </button>
          )}
          <button className="sidebar-nav-item logout-btn" onClick={handleLogout} style={{ marginTop: 'auto' }}>
            <LogOut size={18} />
            Chiqish (LogOut)
          </button>
        </nav>

        {lastStudied && (
          <div className="sidebar-last-studied">
            <span className="last-studied-title">Oxirgi yodlangan sura</span>
            <h4 className="last-studied-name">{lastStudied.name}</h4>
            <span className="last-studied-time">{lastStudied.time}</span>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="app-main-content">
        {/* Top Header bar */}
        <header className="main-header">
          <div className="main-header-info">
            <h1 className="main-header-title">Qalbimdagi Qur'on</h1>
            <p className="main-header-subtitle">
              {activeTab === 'list' && 'Suralar Ro\'yxati'}
              {activeTab === 'todos' && 'Kunlik Reja va Vazifalar'}
              {activeTab === 'stats' && 'Mening Progress Statistikam'}
              {activeTab === 'reminders' && 'Takrorlash va Eslatmalar'}
              {activeTab === 'profile' && 'Akkaunt Sozlamalari'}
              {activeTab === 'users' && 'Foydalanuvchilarni Boshqarish'}
            </p>
          </div>
          <div className="main-header-actions">
            {currentUser.role === 'admin' && activeTab === 'list' && (
              <button
                className={`admin-toggle-pill ${adminMode ? 'active' : ''}`}
                onClick={() => setAdminMode(!adminMode)}
                title="Sura qo'shish paneli"
              >
                <Sparkles size={16} />
                <span>Admin Rejimi</span>
              </button>
            )}
            <button className="admin-toggle-pill mobile-only" onClick={handleLogout} title="Tizimdan chiqish">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Circular stats banner */}
        <section className="dashboard-stats">
          <CircularProgress
            percentage={surahsPercent}
            value={stats?.memorizedSurahs || 0}
            total={stats?.totalSurahs || 114}
            label="Sura"
            color="#D84C7B"
          />
          <CircularProgress
            percentage={versesPercent}
            value={stats?.memorizedVerses || 0}
            total={stats?.totalVerses || 6236}
            label="Oyat"
            color="#E57399"
          />
          <CircularProgress
            percentage={juzPercent}
            value={stats?.memorizedJuzs || 0}
            total={30}
            label="Juz"
            color="#F7A8C4"
          />
        </section>

        {/* Dynamic Tab Render */}
        {activeTab === 'list' && (
          <div className="content-scroll-container" style={{ padding: '20px' }}>
            {/* Heatmap Widget */}
            {renderHeatmap()}

            {/* Admin create surah card */}
            {adminMode && currentUser.role === 'admin' && (
              <div className="admin-card" style={{ marginBottom: '20px' }}>
                <h3 className="admin-form-title">Yangi Sura Yozib Olish (Global)</h3>
                <form onSubmit={handleCreateSurah} className="admin-form-layout">
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Sura Nomeri (1-114)</label>
                      <input
                        type="number"
                        className="admin-input"
                        placeholder="Masalan: 1"
                        value={adminNumber}
                        onChange={(e) => setAdminNumber(e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Sura Nomi</label>
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="Avtomatik to'ldiriladi"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Oyatlar Soni</label>
                      <input
                        type="number"
                        className="admin-input"
                        placeholder="Avtomatik to'ldiriladi"
                        value={adminVerses}
                        onChange={(e) => setAdminVerses(e.target.value)}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Juz (1-30)</label>
                      <select
                        className="admin-select"
                        value={adminJuz}
                        onChange={(e) => setAdminJuz(e.target.value)}
                      >
                        {Array.from({ length: 30 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1}-juz
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formError && <p className="form-error-msg">{formError}</p>}
                  {formSuccess && <p className="form-success-msg">{formSuccess}</p>}

                  <button type="submit" className="admin-submit-btn">
                    Sura va Checkboxlarni Generatsiya Qilish
                  </button>
                </form>
              </div>
            )}

            {/* Filters and Search toolbar */}
            <div className="toolbar-layout" style={{ marginBottom: '20px' }}>
              <div className="search-box-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Sura nomi yoki raqamini qidirish..."
                  className="admin-input search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-dropdown-wrapper">
                <Filter size={16} className="filter-icon" />
                <select
                  className="admin-select filter-select"
                  value={juzFilter}
                  onChange={(e) => setJuzFilter(e.target.value)}
                >
                  <option value="all">Barcha Juzlar</option>
                  {Array.from({ length: 30 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Juz {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filters-bar-buttons">
                <button
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  Barchasi
                </button>
                <button
                  className={`filter-btn ${filter === 'memorized' ? 'active' : ''}`}
                  onClick={() => setFilter('memorized')}
                >
                  Yodlangan
                </button>
                <button
                  className={`filter-btn ${filter === 'remaining' ? 'active' : ''}`}
                  onClick={() => setFilter('remaining')}
                >
                  Qolgan
                </button>
              </div>
            </div>

            {/* Surahs Grid Section */}
            <h2 className="surah-section-title">Suralar Ro'yxati</h2>
            
            <div className="surahs-grid-desktop" style={{ marginTop: '12px' }}>
              {filteredSurahs.length > 0 ? (
                filteredSurahs.map((surah) => {
                  const percent = (surah.memorizedCount / (surah.verseCount || 1)) * 100;
                  return (
                    <div
                      key={surah.id}
                      className={`surah-card ${surah.isCompleted ? 'completed' : ''}`}
                      onClick={() => handleOpenSurah(surah.id)}
                    >
                      {!surah.isCompleted && (
                        <div
                          className="surah-card-progress-bg"
                          style={{ width: `${percent}%` }}
                        />
                      )}

                      <div className="surah-card-content">
                        <div className="surah-number-badge">{surah.number}</div>
                        <div className="surah-info">
                          <span className="surah-name">{surah.name}</span>
                          <span className="surah-progress-text">
                            {surah.memorizedCount} / {surah.verseCount} oyat ({surah.juz}-juz)
                          </span>
                        </div>
                      </div>

                      <div className="surah-card-action">
                        {surah.isCompleted && (
                          <div className="completed-check-icon">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                        {currentUser.role === 'admin' && (
                          <button
                            className="admin-delete-btn"
                            onClick={(e) => handleDeleteSurah(surah.id, e)}
                            title="Surani butunlay o'chirish"
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '14px' }}>
                  Hech qanday sura topilmadi.
                </p>
              )}
            </div>

            {/* Mobile Study Banner */}
            {lastStudied && (
              <div className="last-studied-section mobile-only">
                <div>
                  <span className="last-studied-title">Oxirgi yodlagan sura</span>
                  <h4 className="last-studied-name">{lastStudied.name}</h4>
                </div>
                <span className="last-studied-time">{lastStudied.time}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'todos' && (
          <div className="content-scroll-container padding-20" style={{ maxWidth: '640px', margin: '0 auto' }}>
            {renderTodoList()}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="content-scroll-container padding-20">
            <div className="stats-tab-grid">
              <div className="achievement-card">
                <Award className="achievement-badge-icon" />
                <h3 className="achievement-mashallah">Mashallah!</h3>
                <p className="achievement-msg">
                  Siz hozirgacha <strong>{stats?.memorizedSurahs || 0} ta sura</strong> va <strong>{stats?.memorizedVerses || 0} ta oyat</strong> yodladingiz. Alloh hifzu himoyasida saqlasin!
                </p>
              </div>

              <div className="stats-side-widgets">
                <div className="streak-card">
                  <div className="streak-icon">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span className="streak-label">Kunlik maqsad</span>
                    <p className="streak-value">{currentUser.dailyTarget}</p>
                  </div>
                </div>
                <div className="streak-card">
                  <div className="streak-icon">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="streak-label">Ketma-ketlik</span>
                    <p className="streak-value">7 kun yodlandi</p>
                  </div>
                </div>

                <div className="motivation-quote-card">
                  "Albatta, Qur'on oson yodlanish xususiyatiga ega. Kim xohlasa, Alloh unga o'qishni va yodlashni oson qiladi."
                  <span className="motivation-author">(Buxoriy)</span>
                </div>
              </div>
            </div>

            <h3 className="surah-section-title" style={{ margin: '24px 0 12px 0' }}>Juzlar Progressi (1-30)</h3>
            <div className="juz-progress-grid-desktop">
              {stats?.juzs.map((juz) => {
                const p = (juz.memorizedVerses / (juz.totalVerses || 1)) * 100;
                return (
                  <div key={juz.juzNumber} className="juz-progress-box">
                    <div className="juz-progress-header">
                      <span className="juz-number-title">{juz.juzNumber}-juz</span>
                      <span className="juz-progress-ratio">{juz.memorizedVerses} / {juz.totalVerses} oyat ({p.toFixed(0)}%)</span>
                    </div>
                    <div className="juz-progress-track">
                      <div className="juz-progress-fill" style={{ width: `${p}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="content-scroll-container padding-20">
            <div className="reminders-dashboard-layout">
              <div className="reminders-list-pane">
                <h3 className="surah-section-title" style={{ margin: '0 0 12px 0' }}>Kunlik Eslatmalar</h3>
                <div className="reminders-flex-list">
                  {reminders.map((rem) => (
                    <div key={rem.id} className="reminder-card">
                      <div className="reminder-info">
                        <span className="reminder-time">{rem.time}</span>
                        <span className="reminder-name">{rem.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={rem.isActive}
                            onChange={() => handleToggleReminder(rem.id)}
                          />
                          <span className="slider"></span>
                        </label>
                        <button
                          className="admin-delete-btn"
                          style={{ padding: '4px' }}
                          onClick={() => handleDeleteReminder(rem.id)}
                          title="Eslatmani o'chirish"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Reminder Form */}
                <form onSubmit={handleAddReminder} className="admin-form-layout" style={{ backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', marginTop: '16px', boxShadow: 'var(--shadow)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-dark)' }}>Yangi Eslatma Qo'shish</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="time"
                      className="admin-input"
                      style={{ flex: '1 1 80px' }}
                      value={newReminderTime}
                      onChange={(e) => setNewReminderTime(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="admin-input"
                      style={{ flex: '2 1 180px' }}
                      placeholder="Eslatma nomi (masalan: Takrorlash)"
                      value={newReminderName}
                      onChange={(e) => setNewReminderName(e.target.value)}
                      required
                    />
                    <button type="submit" className="admin-submit-btn" style={{ padding: '8px 16px', marginTop: 0, flex: '1 1 auto' }}>
                      Qo'shish
                    </button>
                  </div>
                </form>
              </div>

              <div className="repetition-table-pane">
                <h3 className="surah-section-title" style={{ margin: '0 0 12px 0' }}>Takrorlash Rejasi (Milestones)</h3>
                
                {surahs.filter(s => s.isCompleted).length > 0 ? (
                  <div className="repetition-flex-list">
                    {surahs.filter(s => s.isCompleted).map((s) => {
                      const checks = repChecks[s.id] || {};
                      return (
                        <div key={s.id} className="repetition-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-dark)' }}>{s.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.verseCount}-oyat ({s.juz}-juz)</span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
                            {[
                              { key: 'day1', label: '1-kun' },
                              { key: 'day7', label: '7-kun' },
                              { key: 'day30', label: '30-kun' }
                            ].map((milestone) => {
                              const isChecked = !!checks[milestone.key];
                              return (
                                <button
                                  key={milestone.key}
                                  type="button"
                                  onClick={() => handleToggleRepCheck(s.id, milestone.key)}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px',
                                    borderRadius: '8px',
                                    border: '1.5px solid',
                                    borderColor: isChecked ? 'var(--primary)' : 'var(--border-color)',
                                    backgroundColor: isChecked ? 'var(--primary-light)' : '#FFFFFF',
                                    color: isChecked ? 'var(--primary-dark)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    transition: 'var(--transition)'
                                  }}
                                >
                                  <span>{milestone.label}</span>
                                  {isChecked ? <Check size={12} strokeWidth={3} /> : <span style={{ width: 12, height: 12 }} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="achievement-card" style={{ padding: '20px', backgroundColor: 'var(--bg-app)', border: '1px dashed var(--primary)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      🌟 Sizda hali yodlangan suralar yo'q.<br />
                      Suralarning barcha oyatlarini checkbox orqali belgilab to'liq yodlasangiz, ular bu yerda **Takrorlash Rejasi**da avtomatik paydo bo'ladi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="content-scroll-container padding-20">
            <div className="profile-dashboard-layout">
              <div className="profile-user-card">
                <div className="profile-avatar-placeholder">{currentUser.name.slice(0,1).toUpperCase()}</div>
                <h2 className="profile-name">{currentUser.name}</h2>
                <p className="profile-status-quote">Alhamdulillah, yo'lda davom eting!</p>
              </div>

              <div className="profile-settings-pane">
                <form onSubmit={handleUpdateProfile} className="admin-form-layout" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
                  <h3 className="admin-form-title" style={{ marginBottom: '12px' }}>Profil Ma'lumotlarini Tahrirlash</h3>
                  
                  <div className="admin-form-group">
                    <label>To'liq Ismingiz</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Foydalanuvchi logini (Username)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={profileUsername}
                      onChange={(e) => setProfileUsername(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Yangi Parol (O'zgartirmaslik uchun bo'sh qoldiring)</label>
                    <input
                      type="password"
                      className="admin-input"
                      placeholder="Yashirin kod kiritish"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Kunlik Yodlash Maqsadingiz</label>
                    <textarea
                      className="admin-input"
                      rows={2}
                      placeholder="Masalan: Kuniga 1 ta sura yodlash..."
                      value={profileTarget}
                      onChange={(e) => setProfileTarget(e.target.value)}
                    />
                  </div>

                  {profileError && <p className="form-error-msg">{profileError}</p>}
                  {profileSuccess && <p className="form-success-msg">{profileSuccess}</p>}

                  <button type="submit" className="admin-submit-btn">
                    Profilni Saqlash
                  </button>
                </form>

                <h3 className="surah-section-title" style={{ margin: '16px 0 8px 0' }}>Ma'lumotlar Zaxira Nusxasi</h3>
                <div className="backup-buttons">
                  <button className="backup-btn" onClick={handleExportBackup}>
                    <Download size={16} />
                    Eksport (JSON)
                  </button>
                  <label className="backup-btn" style={{ cursor: 'pointer' }}>
                    <Upload size={16} />
                    Import (JSON)
                    <input
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handleImportBackup}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && currentUser.role === 'admin' && (
          <div className="content-scroll-container padding-20">
            <h3 className="surah-section-title" style={{ margin: '0 0 16px 0' }}>Foydalanuvchilar va Ularning Statistikasi</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {adminUsers.map((u) => (
                <div key={u.id} className="streak-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="profile-avatar-placeholder" style={{ width: '40px', height: '40px', fontSize: '16px', border: '2px solid var(--primary-dark)' }}>
                      {u.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {u.name} {u.role === 'admin' && <span style={{ fontSize: '9px', backgroundColor: 'var(--primary-dark)', color: 'white', padding: '2px 6px', borderRadius: '8px', marginLeft: '4px' }}>Admin</span>}
                      </h4>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Login: <code>{u.username}</code></p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {u.role !== 'admin' && u.stats ? (
                      <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 600, color: 'var(--primary-dark)' }}>
                        <p>{u.stats.memorizedSurahs} ta sura</p>
                        <p style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{u.stats.memorizedVerses} ta oyat</p>
                      </div>
                    ) : (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Statistika yo'q</span>
                    )}

                    <button
                      className="admin-toggle-pill"
                      style={{ padding: '6px 10px', display: 'flex', gap: '4px' }}
                      onClick={() => {
                        setResetUser(u);
                        setResetPassword('');
                        setResetSuccess('');
                        setResetError('');
                      }}
                    >
                      <KeyRound size={12} />
                      <span>Parol</span>
                    </button>

                    {u.id !== currentUser.id && (
                      <button
                        className="admin-delete-btn"
                        style={{ padding: '6px', border: '1px solid #DC2626', color: '#DC2626', backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        title="Foydalanuvchini o'chirish"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav Bar - Mobile only */}
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <BookOpen className="nav-item-icon" />
          <span className="nav-item-text">Jadval</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart2 className="nav-item-icon" />
          <span className="nav-item-text">Statistika</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          <CheckSquare className="nav-item-icon" />
          <span className="nav-item-text">Reja</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          <Bell className="nav-item-icon" />
          <span className="nav-item-text">Eslatmalar</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User className="nav-item-icon" />
          <span className="nav-item-text">Profil</span>
        </button>
        {currentUser.role === 'admin' && (
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="nav-item-icon" />
            <span className="nav-item-text">Userlar</span>
          </button>
        )}
      </nav>

      {/* Surah Detail Modal */}
      {selectedSurah && (
        <div className="modal-overlay" onClick={() => setSelectedSurah(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <span className="modal-title">{selectedSurah.name}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {selectedSurah.number}-sura ({selectedSurah.juz}-juz)
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedSurah(null)}>
                <ChevronLeft size={20} />
              </button>
            </div>

            <div className="modal-actions">
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Yodlangan: {selectedSurah.memorizedVerses.length} / {selectedSurah.verseCount} oyat
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="modal-actions-btn"
                  onClick={() => handleToggleBulk(true)}
                >
                  Hammasini yodladim
                </button>
                <button
                  className="modal-actions-btn"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
                  onClick={() => handleToggleBulk(false)}
                >
                  Hammasini tozalash
                </button>
              </div>
            </div>

            <div className="verses-scroll-area">
              <div className="verses-grid">
                {Array.from({ length: selectedSurah.verseCount }, (_, i) => {
                  const verseNo = i + 1;
                  const isChecked = selectedSurah.memorizedVerses.includes(verseNo);
                  return (
                    <div
                      key={verseNo}
                      className={`verse-checkbox-card ${isChecked ? 'checked' : ''}`}
                      onClick={() => handleToggleVerse(verseNo, !isChecked)}
                    >
                      <div className="verse-label">
                        <span className="verse-title">{selectedSurah.name} {verseNo}</span>
                        <span className="verse-juz-tag">{selectedSurah.juz}-juz</span>
                      </div>
                      <div className="verse-checkbox-circle">
                        {isChecked && (
                          <Check className="verse-check-mark" strokeWidth={3} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin User Password Reset Modal */}
      {resetUser && (
        <div className="modal-overlay" onClick={() => setResetUser(null)}>
          <div className="modal-content" style={{ width: '400px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ fontSize: '16px' }}>Parolni yangilash</h3>
              <button className="modal-close-btn" onClick={() => setResetUser(null)}>
                <ChevronLeft size={16} />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="admin-form-layout" style={{ padding: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Foydalanuvchi: <strong>{resetUser.name}</strong> (<code>{resetUser.username}</code>)
              </p>
              
              <div className="admin-form-group">
                <label>Yangi parol</label>
                <input
                  type="password"
                  className="admin-input"
                  placeholder="Kamida 4 ta belgi"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  required
                />
              </div>

              {resetError && <p className="form-error-msg">{resetError}</p>}
              {resetSuccess && <p className="form-success-msg">{resetSuccess}</p>}

              <button type="submit" className="admin-submit-btn" style={{ marginTop: '8px' }}>
                Parolni Yangilash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
