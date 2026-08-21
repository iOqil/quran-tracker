import re

file_path = r'c:\Users\imomn\Desktop\KuranTracker\client\src\pages\Reminders.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add the state variable
content = content.replace(
    "const [repPlanFormSurahs, setRepPlanFormSurahs] = useState<number[]>([]);",
    "const [repPlanFormSurahs, setRepPlanFormSurahs] = useState<number[]>([]);\n  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState(false);"
)

# 2. Add closing logic inside handleCreateRepetitionPlan to close dropdown on success
old_success = """      if (res.ok) {
        setRepPlanFormSurahs([]);
        setRepPlanFormDays('30');
        setRepPlanFormTimes('09:00');"""
new_success = """      if (res.ok) {
        setRepPlanFormSurahs([]);
        setIsSurahDropdownOpen(false);
        setRepPlanFormDays('30');
        setRepPlanFormTimes('09:00');"""
content = content.replace(old_success, new_success)

# 3. Modify the JSX
old_jsx = """            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Suralarni tanlang</label>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '8px', backgroundColor: 'var(--bg-card)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px', cursor: 'pointer' }}>
                  <input type="checkbox" onChange={(e) => {
                     const available = surahs.filter(s => s.isCompleted && !repetitionPlans.some(p => p.surahId === s.id));
                     if (e.target.checked) setRepPlanFormSurahs(available.map(s => s.id));
                     else setRepPlanFormSurahs([]);
                  }} checked={surahs.filter(s => s.isCompleted && !repetitionPlans.some(p => p.surahId === s.id)).length > 0 && repPlanFormSurahs.length === surahs.filter(s => s.isCompleted && !repetitionPlans.some(p => p.surahId === s.id)).length} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-dark)' }}>Barchasini belgilash</span>
                </label>
                {surahs
                  .filter(s => s.isCompleted && !repetitionPlans.some(p => p.surahId === s.id))
                  .map(s => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={repPlanFormSurahs.includes(s.id)} 
                      onChange={(e) => {
                         if (e.target.checked) setRepPlanFormSurahs([...repPlanFormSurahs, s.id]);
                         else setRepPlanFormSurahs(repPlanFormSurahs.filter(id => id !== s.id));
                      }}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{s.name} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({s.verseCount} oyat)</span></span>
                  </label>
                ))}
              </div>
            </div>"""

new_jsx = """            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Suralarni tanlang</label>
              <div 
                onClick={() => setIsSurahDropdownOpen(!isSurahDropdownOpen)}
                className="auth-input" 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none', height: '42px', padding: '0 12px' }}
              >
                <span style={{ fontSize: '13px', color: repPlanFormSurahs.length > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {repPlanFormSurahs.length > 0 ? `${repPlanFormSurahs.length} ta sura tanlandi` : '-- Sura tanlang --'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▼</span>
              </div>
              
              {isSurahDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: '4px', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '8px', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" onChange={(e) => {
                       const available = surahs.filter(s => s.isCompleted && !repetitionPlans.some(p => p.surahId === s.id));
                       if (e.target.checked) setRepPlanFormSurahs(available.map(s => s.id));
                       else setRepPlanFormSurahs([]);
                    }} checked={surahs.filter(s => s.isCompleted && !repetitionPlans.some(p => p.surahId === s.id)).length > 0 && repPlanFormSurahs.length === surahs.filter(s => s.isCompleted && !repetitionPlans.some(p => p.surahId === s.id)).length} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-dark)' }}>Barchasini belgilash</span>
                  </label>
                  {surahs
                    .filter(s => s.isCompleted && !repetitionPlans.some(p => p.surahId === s.id))
                    .map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={repPlanFormSurahs.includes(s.id)} 
                        onChange={(e) => {
                           if (e.target.checked) setRepPlanFormSurahs([...repPlanFormSurahs, s.id]);
                           else setRepPlanFormSurahs(repPlanFormSurahs.filter(id => id !== s.id));
                        }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{s.name} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({s.verseCount} oyat)</span></span>
                    </label>
                  ))}
                </div>
              )}
            </div>"""

content = content.replace(old_jsx, new_jsx)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Dropdown added.")
