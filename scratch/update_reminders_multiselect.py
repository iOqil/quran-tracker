import re

file_path = r'c:\Users\imomn\Desktop\KuranTracker\client\src\pages\Reminders.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update state variable
content = content.replace("const [repPlanFormSurah, setRepPlanFormSurah] = useState('');", "const [repPlanFormSurahs, setRepPlanFormSurahs] = useState<number[]>([]);")

# 2. Update handleCreateRepetitionPlan signature & logic
old_handle = """  const handleCreateRepetitionPlan = async (e: React.FormEvent) => {
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
          surahId: parseInt(repPlanFormSurah),
          days: parsedDays,
          times: parsedTimes
        })
      });
      if (res.ok) {
        setRepPlanFormSurah('');
        setRepPlanFormDays('30');
        setRepPlanFormTimes('09:00');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
    }
  };"""

new_handle = """  const handleCreateRepetitionPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || repPlanFormSurahs.length === 0) {
      alert("Iltimos, kamida bitta surani tanlang.");
      return;
    }
    
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
          surahIds: repPlanFormSurahs,
          days: parsedDays,
          times: parsedTimes
        })
      });
      if (res.ok) {
        setRepPlanFormSurahs([]);
        setRepPlanFormDays('30');
        setRepPlanFormTimes('09:00');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error(err);
    }
  };"""
content = content.replace(old_handle, new_handle)

# 3. Update the JSX form
old_jsx = """                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>Sura tanlang</label>
                  <select
                    className="admin-select"
                    value={repPlanFormSurah}
                    onChange={(e) => setRepPlanFormSurah(e.target.value)}
                    required
                  >
                    <option value="">-- Sura tanlang --</option>
                    {surahs.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.verseCount} oyat)</option>
                    ))}
                  </select>
                </div>"""

new_jsx = """                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>Sura tanlang</label>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px', backgroundColor: 'var(--bg-card)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '4px', cursor: 'pointer' }}>
                      <input type="checkbox" onChange={(e) => {
                         if (e.target.checked) setRepPlanFormSurahs(surahs.map(s => s.id));
                         else setRepPlanFormSurahs([]);
                      }} checked={repPlanFormSurahs.length === surahs.length && surahs.length > 0} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Barchasini belgilash</span>
                    </label>
                    {surahs.map(surah => (
                      <label key={surah.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={repPlanFormSurahs.includes(surah.id)} 
                          onChange={(e) => {
                             if (e.target.checked) setRepPlanFormSurahs([...repPlanFormSurahs, surah.id]);
                             else setRepPlanFormSurahs(repPlanFormSurahs.filter(id => id !== surah.id));
                          }}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{surah.name} ({surah.verseCount} oyat)</span>
                      </label>
                    ))}
                  </div>
                </div>"""

content = content.replace(old_jsx, new_jsx)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Reminders UI updated.")
