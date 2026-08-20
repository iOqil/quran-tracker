import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertCircle, Trash2, Edit2, Plus, Trash } from 'lucide-react';
import type { Surah, RepetitionPlan, UserSession, Reminder } from '../types';

interface RemindersContextType {
  currentUser: UserSession;
  surahs: Surah[];
  repetitionPlans: RepetitionPlan[];
  setRepetitionPlans: React.Dispatch<React.SetStateAction<RepetitionPlan[]>>;
  fetchData: () => void;
}

// Helper: get local date as YYYY-MM-DD (avoids UTC mismatch in UTC+5 timezone)
function getLocalDateStr(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const Reminders: React.FC = () => {
  const {
    currentUser,
    surahs,
    repetitionPlans,
    setRepetitionPlans,
    fetchData
  } = useOutletContext<RemindersContextType>();

  // Reminders states
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [newReminderName, setNewReminderName] = useState('');

  // Repetition Plan states
  const [repPlanFormSurah, setRepPlanFormSurah] = useState('');
  const [repPlanFormDays, setRepPlanFormDays] = useState('30');
  const [repPlanFormTimes, setRepPlanFormTimes] = useState('09:00');

  // Repetition Plan inline edit states
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [editPlanDays, setEditPlanDays] = useState('30');
  const [editPlanTimes, setEditPlanTimes] = useState('09:00');

  // Load reminders on mount
  useEffect(() => {
    if (currentUser) {
      const savedReminders = localStorage.getItem(`userReminders_${currentUser.id}`);
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
        localStorage.setItem(`userReminders_${currentUser.id}`, JSON.stringify(defaultReminders));
      }
    }
  }, [currentUser]);

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

  // Repetition Actions
  const handleCreateRepetitionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !repPlanFormSurah) return;
    
    const daysCount = parseInt(repPlanFormDays.trim(), 10);
    if (isNaN(daysCount) || daysCount <= 0 || daysCount > 100) {
      alert("Kunlar soni 1 va 100 oralig'ida bo'lishi kerak.");
      return;
    }
    const parsedDays = Array.from({ length: daysCount }, (_, i) => i + 1);
    const parsedTimes = repPlanFormTimes.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    if (parsedTimes.length === 0) {
      alert("Takrorlash vaqti kiritilishi shart.");
      return;
    }

    try {
      const res = await fetch('/api/repetition/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          surahId: parseInt(repPlanFormSurah, 10),
          days: parsedDays,
          times: parsedTimes
        })
      });
      if (res.ok) {
        fetchData();
        setRepPlanFormSurah('');
      } else {
        const err = await res.json();
        alert(err.error || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi");
    }
  };

  const handleDeleteRepetitionPlan = async (id: number) => {
    if (!currentUser) return;
    if (!window.confirm("Bu rejani o'chirishni tasdiqlaysizmi? Barcha takrorlashlar tarixi o'chib ketadi!")) return;
    
    try {
      const res = await fetch(`/api/repetition/plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setRepetitionPlans(repetitionPlans.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditRepetitionPlan = (plan: RepetitionPlan) => {
    setEditingPlanId(plan.id);
    try {
      const parsedDays = JSON.parse(plan.days);
      setEditPlanDays(Array.isArray(parsedDays) ? parsedDays.length.toString() : '30');
    } catch {
      setEditPlanDays('30');
    }
    try {
      const parsedTimes = JSON.parse(plan.times);
      setEditPlanTimes(Array.isArray(parsedTimes) ? parsedTimes.join(', ') : plan.times);
    } catch {
      setEditPlanTimes(plan.times);
    }
  };

  const handleSaveEditedRepetitionPlan = async (e: React.FormEvent, surahId: number) => {
    e.preventDefault();
    if (!currentUser) return;

    const daysCount = parseInt(editPlanDays.trim(), 10);
    if (isNaN(daysCount) || daysCount <= 0 || daysCount > 100) {
      alert("Kunlar soni 1 va 100 oralig'ida bo'lishi kerak.");
      return;
    }
    const parsedDays = Array.from({ length: daysCount }, (_, i) => i + 1);
    const parsedTimes = editPlanTimes.split(',').map(t => t.trim()).filter(t => t.length > 0);

    if (parsedTimes.length === 0) {
      alert("Takrorlash vaqti kiritilishi shart.");
      return;
    }

    try {
      const res = await fetch('/api/repetition/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          surahId,
          days: parsedDays,
          times: parsedTimes
        })
      });
      if (res.ok) {
        setEditingPlanId(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi");
    }
  };

  const handleUpdateSessionStatus = async (sessionId: number, status: string) => {
    if (!currentUser) return;
    
    setRepetitionPlans(plans => plans.map(p => ({
      ...p,
      sessions: p.sessions.map(s => s.id === sessionId ? { ...s, status: status as any } : s)
    })));

    try {
      const res = await fetch(`/api/repetition/sessions/${sessionId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const todayStr = getLocalDateStr();

  return (
    <div className="content-scroll-container padding-20" style={{ padding: '20px' }}>
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

        <div className="repetition-table-pane" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="surah-section-title" style={{ margin: '0' }}>Takrorlash Rejasi</h3>

          {/* Plan Creator Form */}
          <form onSubmit={handleCreateRepetitionPlan} className="add-todo-form" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select
                className="auth-input"
                value={repPlanFormSurah}
                onChange={e => setRepPlanFormSurah(e.target.value)}
                style={{ flex: 1, minWidth: '150px' }}
                required
              >
                <option value="">-- Sura tanlang --</option>
                {surahs
                  .filter(s => s.isCompleted && !repetitionPlans.some(p => p.surahId === s.id))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.verseCount} oyat)</option>
                  ))
                }
              </select>
              <input
                type="number"
                min="1"
                max="100"
                className="auth-input"
                value={repPlanFormDays}
                onChange={e => setRepPlanFormDays(e.target.value)}
                placeholder="Kunlar soni (m-n: 30)"
                style={{ flex: 1, minWidth: '150px' }}
                required
              />
              <input
                type="text"
                className="auth-input"
                value={repPlanFormTimes}
                onChange={e => setRepPlanFormTimes(e.target.value)}
                placeholder="Vaqtlar (m-n: 09:00)"
                style={{ flex: 1, minWidth: '150px' }}
                required
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block', lineHeight: '1.4' }}>
              ℹ️ <strong>Takrorlash kunlari (1, 2, 3, 4, 7...)</strong>: Surani yodlagan kuningizdan keyingi nisbiy kunlar. 
              1 = Yodlangan kunning o'zi (bugun), 2 = ertasi kuni, 7 = 7-kuni va h.k.
            </span>
            <button type="submit" className="add-todo-btn" style={{ alignSelf: 'flex-start', marginTop: '6px' }}>
              <Plus size={16} /> Reja yaratish
            </button>
          </form>

          {/* Actionable Sessions (Today + Overdue) */}
          {repetitionPlans.flatMap(p => p.sessions).some(s => s.status === 'Kutilmoqda' && s.date <= todayStr) && (
            <div className="actionable-sessions-panel" style={{ backgroundColor: '#fff0f3', padding: '15px', borderRadius: '12px', border: '1px solid var(--primary-light)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> Bugungi va Kechikkan Takrorlashlar
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {repetitionPlans.map(plan => {
                  const actionable = plan.sessions.filter(s => s.status === 'Kutilmoqda' && s.date <= todayStr);
                  if (actionable.length === 0) return null;
                  
                  return actionable.map(session => (
                    <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ffe3e9', fontSize: '13px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>{plan.surah.name}</strong> 
                        <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                          ({session.dayNumber}-kun · {session.time}) 
                          {session.date < todayStr && <span style={{ color: '#e74c3c', marginLeft: '4px', fontSize: '11px', fontWeight: 600 }}>Kechikkan</span>}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleUpdateSessionStatus(session.id, 'Bajarildi')} className="status-pill btn-success">Bajarildi</button>
                        <button onClick={() => handleUpdateSessionStatus(session.id, 'Qoniqarli')} className="status-pill btn-warning">Qoniqarli</button>
                        <button onClick={() => handleUpdateSessionStatus(session.id, "O'tkazib yuborildi")} className="status-pill btn-danger">O'tkazib yub.</button>
                      </div>
                    </div>
                  ));
                })}
              </div>
            </div>
          )}

          {/* Active Plans List */}
          {repetitionPlans.length > 0 ? (
            <div className="repetition-flex-list">
              {repetitionPlans.map((plan) => {
                const completedCount = plan.sessions.filter(s => s.status === 'Bajarildi' || s.status === 'Qoniqarli').length;
                const progressPercent = Math.round((completedCount / (plan.sessions.length || 1)) * 100);

                // Determine next session
                const pendingSessions = plan.sessions.filter(s => s.status === 'Kutilmoqda');
                
                let nextLabel = "Barcha takrorlashlar tugadi";
                if (pendingSessions.length > 0) {
                  const nextSession = pendingSessions.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0];
                  if (nextSession.date === todayStr) {
                    nextLabel = `Bugun · ${nextSession.time}`;
                  } else if (nextSession.date < todayStr) {
                    nextLabel = `Kechikkan · ${nextSession.date}`;
                  } else {
                    nextLabel = `${nextSession.date} · ${nextSession.time}`;
                  }
                }

                // Group sessions by date for the contribution graph
                const groupedByDate: Record<string, typeof plan.sessions> = {};
                plan.sessions.forEach(s => {
                  if (!groupedByDate[s.date]) groupedByDate[s.date] = [];
                  groupedByDate[s.date].push(s);
                });

                const uniqueDates = Object.keys(groupedByDate).sort();

                return (
                  <div key={plan.id} className="repetition-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div>
                         <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-dark)', display: 'block' }}>{plan.surah.name}</span>
                         <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{plan.surah.verseCount}-oyat · {plan.surah.juz}-juz</span>
                       </div>
                       <div style={{ display: 'flex', gap: '4px' }}>
                         <button onClick={() => handleEditRepetitionPlan(plan)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Tahrirlash">
                           <Edit2 size={16} />
                         </button>
                         <button onClick={() => handleDeleteRepetitionPlan(plan.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="O'chirish">
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>

                     {editingPlanId === plan.id ? (
                       <form onSubmit={(e) => handleSaveEditedRepetitionPlan(e, plan.surahId)} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                           <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>Takrorlash kunlari soni (masalan: 30)</label>
                           <input
                             type="number"
                             min="1"
                             max="100"
                             className="auth-input"
                             value={editPlanDays}
                             onChange={e => setEditPlanDays(e.target.value)}
                             required
                           />
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                           <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>Takrorlash vaqtlari (masalan: 09:00)</label>
                           <input
                             type="text"
                             className="auth-input"
                             value={editPlanTimes}
                             onChange={e => setEditPlanTimes(e.target.value)}
                             required
                           />
                         </div>
                         <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                           <button type="submit" className="status-pill btn-success" style={{ border: '1px solid #c3e6cb' }}>Saqlash</button>
                           <button type="button" onClick={() => setEditingPlanId(null)} className="status-pill btn-danger" style={{ border: '1px solid #f5c6cb' }}>Bekor qilish</button>
                          </div>
                       </form>
                     ) : (
                       <>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                           <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Progress: <strong style={{color: 'var(--primary-dark)'}}>{completedCount} / {plan.sessions.length}</strong> ({progressPercent}%)</span>
                           <span style={{ fontSize: '11px', color: 'var(--primary-dark)', fontWeight: 600, backgroundColor: 'var(--primary-light)', padding: '2px 8px', borderRadius: '12px' }}>
                             Keyingi: {nextLabel}
                           </span>
                         </div>

                         {/* GitHub-style Contribution Graph */}
                         <div className="repetition-grid-wrapper">
                           {uniqueDates.map(dateStr => {
                             const daySessions = groupedByDate[dateStr];
                             let levelClass = 'level-0';

                             if (daySessions.every(s => s.status === 'Bajarildi')) levelClass = 'level-4';
                             else if (daySessions.some(s => s.status === "O'tkazib yuborildi")) levelClass = 'level-red';
                             else if (daySessions.some(s => s.status === 'Bajarildi' || s.status === 'Qoniqarli')) levelClass = 'level-2';
                             else if (dateStr < todayStr && daySessions.some(s => s.status === 'Kutilmoqda')) levelClass = 'level-red';

                             const isToday = dateStr === todayStr;

                             return (
                               <div 
                                 key={dateStr} 
                                 className={`repetition-cell ${levelClass} ${isToday ? 'is-today' : ''}`}
                                 title={`${dateStr}\n${daySessions.map(s => `${s.time}: ${s.status}`).join('\n')}`}
                               ></div>
                             );
                           })}
                         </div>
                       </>
                     )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="achievement-card" style={{ padding: '20px', backgroundColor: 'var(--bg-app)', border: '1px dashed var(--primary)' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                🌟 Hozircha takrorlash rejalari yo'q.<br />
                Suralarni takrorlash jadvalini yaratish uchun yuqoridagi formadan foydalaning.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Reminders;
