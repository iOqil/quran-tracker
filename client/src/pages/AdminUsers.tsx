import React, { useState } from 'react';
import { useOutletContext, Navigate } from 'react-router-dom';
import { KeyRound, Trash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import type { AdminUserDetail, UserSession } from '../types';

interface AdminContextType {
  currentUser: UserSession;
  adminUsers: AdminUserDetail[];
  setAdminUsers: React.Dispatch<React.SetStateAction<AdminUserDetail[]>>;
  fetchData: () => void;
}

export const AdminUsers: React.FC = () => {
  const { currentUser } = useAuth();
  const { adminUsers, setAdminUsers, fetchData } = useOutletContext<AdminContextType>();

  const [resetUser, setResetUser] = useState<AdminUserDetail | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

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
        fetchData();
      } else {
        alert(data.error || 'O\'chirishda xatolik yuz berdi');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Foydalanuvchini o\'chirishda xatolik yuz berdi');
    }
  };

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

  return (
    <div className="content-scroll-container padding-20" style={{ padding: '20px' }}>
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

      {/* Reset Password Modal */}
      {resetUser && (
        <ResetPasswordModal
          resetUser={resetUser}
          onClose={() => setResetUser(null)}
          resetPassword={resetPassword}
          setResetPassword={setResetPassword}
          resetError={resetError}
          resetSuccess={resetSuccess}
          handleResetPassword={handleResetPassword}
        />
      )}
    </div>
  );
};
export default AdminUsers;
