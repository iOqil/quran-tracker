import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Surah, UserSession } from '../types';

interface ProfileContextType {
  currentUser: UserSession;
  surahs: Surah[];
  fetchData: (session?: UserSession) => void;
}

export const Profile: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const { surahs, fetchData } = useOutletContext<ProfileContextType>();

  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileTarget, setProfileTarget] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Sync profile fields from user session
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileUsername(currentUser.username);
      setProfileTarget(currentUser.dailyTarget || '');
      setProfilePassword('');
    }
  }, [currentUser]);

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

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(surahs));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `quran_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

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
          alert(`Zaxira nusxadan ${importCount} ta sura muvaffaqiyatli import qilindi.`);
          fetchData();
        } catch (err) {
          console.error(err);
          alert("Import qilishda xatolik yuz berdi");
        }
      };
    }
  };

  if (!currentUser) return null;

  return (
    <div className="content-scroll-container padding-20" style={{ padding: '20px' }}>
      <div className="profile-dashboard-layout">
        <div className="profile-user-card">
          <div className="profile-avatar-placeholder">{currentUser.name.slice(0, 1).toUpperCase()}</div>
          <h2 className="profile-name">{currentUser.name}</h2>
          <p className="profile-status-quote">Alhamdulillah, yo'lda davom eting!</p>
        </div>

        <div className="profile-settings-pane">
          <form onSubmit={handleUpdateProfile} className="admin-form-layout" style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow)' }}>
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
          <h3 className="surah-section-title" style={{ margin: '24px 0 8px 0', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>Mobil Ilova (Android)</h3>
          <div style={{ backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Qalbimdagi Qur'on ilovasining Android (.apk) versiyasini yuklab oling. Bu orqali siz ilovani Play Market'dagi kabi telefoningizga to'g'ridan to'g'ri o'rnatishingiz, doimiy oflayn foydalanishingiz va ovozli bildirishnomalardan uzluksiz bahramand bo'lishingiz mumkin.
            </p>
            <a 
              href="https://github.com/iOqil/quran-tracker/releases/download/latest-build/app-debug.apk" 
              className="admin-submit-btn" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
            >
              <Download size={18} />
              Android APK Yuklab Olish
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Profile;
