import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserSession, Reminder } from '../types';

interface LoginProps {
  onLoginSuccess: (user: UserSession, defaultReminders: Reminder[]) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

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

      const session: UserSession = { token: data.token, ...data.user };
      localStorage.setItem('userSession', JSON.stringify(session));
      setCurrentUser(session);

      // Load specific reminders
      let remindersList: Reminder[] = [];
      const savedReminders = localStorage.getItem(`userReminders_${data.user.id}`);
      if (savedReminders) {
        remindersList = JSON.parse(savedReminders);
      } else {
        const defaultReminders: Reminder[] = [
          { id: 1, time: '08:00', name: 'Bomdoddan keyin yodlash', isActive: true },
          { id: 2, time: '14:00', name: 'Pauza vaqtida yodlash', isActive: false },
          { id: 3, time: '20:30', name: 'Isha namozidan keyin yodlash', isActive: true },
          { id: 4, time: '22:00', name: 'Yotishdan oldin takrorlash', isActive: false },
        ];
        remindersList = defaultReminders;
        localStorage.setItem(`userReminders_${data.user.id}`, JSON.stringify(defaultReminders));
      }

      onLoginSuccess(session, remindersList);
      navigate('/');
    } catch (error) {
      setAuthError('Serverga ulanib bo\'lmadi');
    }
  };

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

      const session: UserSession = { token: data.token, ...data.user };
      localStorage.setItem('userSession', JSON.stringify(session));
      setCurrentUser(session);

      const defaultReminders: Reminder[] = [
        { id: 1, time: '08:00', name: 'Bomdoddan keyin yodlash', isActive: true },
        { id: 2, time: '14:00', name: 'Pauza vaqtida yodlash', isActive: false },
        { id: 3, time: '20:30', name: 'Isha namozidan keyin yodlash', isActive: true },
        { id: 4, time: '22:00', name: 'Yotishdan oldin takrorlash', isActive: false },
      ];
      localStorage.setItem(`userReminders_${data.user.id}`, JSON.stringify(defaultReminders));

      onLoginSuccess(session, defaultReminders);
      navigate('/');
    } catch (error) {
      setAuthError('Serverga ulanib bo\'lmadi');
    }
  };

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
};
