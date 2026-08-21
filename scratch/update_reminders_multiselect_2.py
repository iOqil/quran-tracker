import re

file_path = r'c:\Users\imomn\Desktop\KuranTracker\client\src\pages\Reminders.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix occurrences of repPlanFormSurah
content = re.sub(r'if \(!currentUser \|\| !repPlanFormSurah\) return;', 'if (!currentUser || repPlanFormSurahs.length === 0) {\n      alert("Iltimos, kamida bitta surani tanlang.");\n      return;\n    }', content)

content = re.sub(r'surahId: parseInt\(repPlanFormSurah(?:, 10)?\),', 'surahIds: repPlanFormSurahs,', content)

content = re.sub(r"setRepPlanFormSurah\(''\);", "setRepPlanFormSurahs([]);", content)

# Check if JSX replace failed too. Yes, it found line 368 with value={repPlanFormSurah}
# Which means the JSX old_jsx didn't match. Let's replace the <select> block directly using regex.

select_regex = r'<div style=\{\{\s*flex:\s*\'1 1 200px\'\s*\}\}\>.*?<label.*?>Sura tanlang</label>.*?<select.*?value=\{repPlanFormSurah\}.*?>.*?</select>.*?</div>'
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

content = re.sub(select_regex, new_jsx.replace('\\', '\\\\'), content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Second pass complete.")
