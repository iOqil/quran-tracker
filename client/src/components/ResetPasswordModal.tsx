import React from 'react';
import { ChevronLeft } from 'lucide-react';
import type { AdminUserDetail } from '../types';

interface ResetPasswordModalProps {
  resetUser: AdminUserDetail;
  onClose: () => void;
  resetPassword: string;
  setResetPassword: (val: string) => void;
  resetError: string;
  resetSuccess: string;
  handleResetPassword: (e: React.FormEvent) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  resetUser,
  onClose,
  resetPassword,
  setResetPassword,
  resetError,
  resetSuccess,
  handleResetPassword
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '400px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ fontSize: '16px' }}>Parolni yangilash</h3>
          <button className="modal-close-btn" onClick={onClose}>
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
  );
};
