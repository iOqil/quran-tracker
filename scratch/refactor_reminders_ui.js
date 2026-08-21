const fs = require('fs');
const filePath = 'c:\\\\Users\\\\imomn\\\\Desktop\\\\KuranTracker\\\\client\\\\src\\\\pages\\\\Reminders.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// The tricky part: fetching Reminders from API instead of localStorage.
// Let's replace the whole useEffect and handler logic for Reminders.
// Since React requires it to be a bit clean, I'll regex the specific functions.

content = content.replace(/useEffect\(\(\) => \{\n    const fetchRepetitionPlans = async \(\) => \{[\s\S]*?    fetchRepetitionPlans\(\);\n  \}, \[currentUser\]\);/, 
`useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, remindersRes] = await Promise.all([
          fetch('/api/repetition/plans', {
            headers: { 'Authorization': \`Bearer \${currentUser.token}\` }
          }),
          fetch('/api/reminders', {
            headers: { 'Authorization': \`Bearer \${currentUser.token}\` }
          })
        ]);
        if (plansRes.ok) {
          setRepetitionPlans(await plansRes.json());
        }
        if (remindersRes.ok) {
          const dbReminders = await remindersRes.json();
          if (dbReminders.length > 0) {
            setReminders(dbReminders);
          } else {
            // Default reminders
            const defaultReminders = [
              { name: 'Bomdoddan keyin yodlash', time: '05:30', isActive: true },
              { name: 'Peshindan keyin takrorlash', time: '13:30', isActive: true },
              { name: 'Xuftondan keyin mustahkamlash', time: '21:00', isActive: true }
            ];
            const created = [];
            for (const r of defaultReminders) {
              const res = await fetch('/api/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${currentUser.token}\` },
                body: JSON.stringify(r)
              });
              if (res.ok) created.push(await res.json());
            }
            setReminders(created);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, [currentUser]);`);

content = content.replace(/const handleAddReminder = \(e: React.FormEvent\) => \{[\s\S]*?localStorage.setItem\(\`userReminders_\$\{currentUser\.id\}\`, JSON.stringify\(updated\)\);\n  \};/,
`const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTime || !newReminderText) return;
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${currentUser.token}\` },
        body: JSON.stringify({ name: newReminderText, time: newReminderTime, isActive: true })
      });
      if (res.ok) {
        setReminders([...reminders, await res.json()]);
        setNewReminderText('');
        setNewReminderTime('');
      }
    } catch (e) {}
  };`);

content = content.replace(/const handleToggleReminder = \(id: number\) => \{[\s\S]*?localStorage.setItem\(\`userReminders_\$\{currentUser\.id\}\`, JSON.stringify\(updated\)\);\n  \};/,
`const handleToggleReminder = async (id: number) => {
    const rem = reminders.find(r => r.id === id);
    if (!rem) return;
    try {
      const res = await fetch(\`/api/reminders/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${currentUser.token}\` },
        body: JSON.stringify({ isActive: !rem.isActive, name: rem.name, time: rem.time })
      });
      if (res.ok) {
        setReminders(reminders.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
      }
    } catch (e) {}
  };`);

content = content.replace(/const handleDeleteReminder = \(id: number\) => \{[\s\S]*?localStorage.setItem\(\`userReminders_\$\{currentUser\.id\}\`, JSON.stringify\(updated\)\);\n  \};/,
`const handleDeleteReminder = async (id: number) => {
    try {
      const res = await fetch(\`/api/reminders/\${id}\`, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${currentUser.token}\` }
      });
      if (res.ok) {
        setReminders(reminders.filter(r => r.id !== id));
      }
    } catch (e) {}
  };`);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done refactoring Reminders.tsx');
