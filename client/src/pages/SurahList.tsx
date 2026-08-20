import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search, Filter, Trash, Check } from 'lucide-react';
import { FaollikHeatmap } from '../components/FaollikHeatmap';
import { SurahDetailModal } from '../components/SurahDetailModal';
import { CircularProgress } from '../components/CircularProgress';
import type { Surah, SurahDetail, Stats, UserSession } from '../types';

interface SurahContextType {
  currentUser: UserSession;
  surahs: Surah[];
  setSurahs: React.Dispatch<React.SetStateAction<Surah[]>>;
  stats: Stats | null;
  setStats: React.Dispatch<React.SetStateAction<Stats | null>>;
  fetchData: () => void;
  activities: Record<string, number>;
  setActivities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  lastStudied: { name: string; time: string } | null;
  setLastStudied: React.Dispatch<React.SetStateAction<{ name: string; time: string } | null>>;
  fetchActivities: () => void;
  adminMode: boolean;
}

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
  80: { name: "Abasa", verses: 42, juz: 30 },
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
  108: { name: "Al-Kawthar", verses: 3, juz: 30 },
  109: { name: "Al-Kafirun", verses: 6, juz: 30 },
  110: { name: "An-Nasr", verses: 3, juz: 30 },
  111: { name: "Al-Masad", verses: 5, juz: 30 },
  112: { name: "Al-Ikhlas", verses: 4, juz: 30 },
  113: { name: "Al-Falaq", verses: 5, juz: 30 },
  114: { name: "An-Nas", verses: 6, juz: 30 }
};

export const SurahList: React.FC = () => {
  const {
    currentUser,
    surahs,
    setSurahs,
    stats,
    setStats,
    fetchData,
    activities,
    lastStudied,
    setLastStudied,
    fetchActivities,
    adminMode
  } = useOutletContext<SurahContextType>();

  // Calculate percentages
  const surahsPercent = stats ? (stats.memorizedSurahs / (stats.totalSurahs || 114)) * 100 : 0;
  const versesPercent = stats ? (stats.memorizedVerses / (stats.totalVerses || 6236)) * 100 : 0;
  const juzPercent = stats ? (stats.memorizedJuzs / 30) * 100 : 0;

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [juzFilter, setJuzFilter] = useState('all');
  const [filter, setFilter] = useState<'all' | 'memorized' | 'remaining'>('all');

  // Modal State
  const [selectedSurah, setSelectedSurah] = useState<SurahDetail | null>(null);

  // Admin Form States
  const [adminNumber, setAdminNumber] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminVerses, setAdminVerses] = useState('');
  const [adminJuz, setAdminJuz] = useState('30');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Auto-fill admin form
  useEffect(() => {
    const sNum = parseInt(adminNumber, 10);
    if (!isNaN(sNum) && quranSurahDictionary[sNum]) {
      const dictVal = quranSurahDictionary[sNum];
      setAdminName(dictVal.name);
      setAdminVerses(dictVal.verses.toString());
      setAdminJuz(dictVal.juz.toString());
    }
  }, [adminNumber]);

  // Open Surah details modal
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

  // Toggle single verse checkbox
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

  // Toggle Bulk completion
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
          verseCount: parseInt(adminVerses, 10),
          number: adminNumber ? parseInt(adminNumber, 10) : undefined,
          juz: parseInt(adminJuz, 10),
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

  // Query filtering logic
  const filteredSurahs = surahs.filter((surah) => {
    const matchesSearch =
      surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.number.toString() === searchQuery;

    const matchesJuz =
      juzFilter === 'all' || surah.juz.toString() === juzFilter;

    const matchesStatus =
      filter === 'all' ||
      (filter === 'memorized' && surah.isCompleted) ||
      (filter === 'remaining' && !surah.isCompleted);

    return matchesSearch && matchesJuz && matchesStatus;
  });

  return (
    <div className="content-scroll-container" style={{ padding: '20px' }}>
      
      {/* Top dashboard section: progress stats (vertical column) & activity heatmap side-by-side */}
      <div className="dashboard-top-grid">
        {/* Left Column: Progress Bars column (Vertical stack) */}
        <div className="dashboard-stats-vertical">
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
            color="#FCD3E1"
          />
        </div>
        
        {/* Right Column: Heatmap (calendar) */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <FaollikHeatmap activities={activities} />
        </div>
      </div>

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

      {/* Surah Detail Modal */}
      {selectedSurah && (
        <SurahDetailModal
          selectedSurah={selectedSurah}
          onClose={() => setSelectedSurah(null)}
          handleToggleBulk={handleToggleBulk}
          handleToggleVerse={handleToggleVerse}
        />
      )}
    </div>
  );
};
export default SurahList;
