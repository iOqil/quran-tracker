const fs = require('fs');
const path = require('path');

const clientSrcDir = 'c:\\\\Users\\\\imomn\\\\Desktop\\\\KuranTracker\\\\client\\\\src';

function patchCatchBlocks(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // We want to avoid rolling back if !navigator.onLine
    // In SurahList.tsx, the rollback looks like:
    // } catch (error) {
    //   setSelectedSurah({ ...
    //   setSurahs(previousSurahs);
    // }
    
    // Let's replace `catch (error) {` with `catch (error) { if (!navigator.onLine) { console.log('Offline: Action queued'); return; }`
    // We'll use a regex that handles generic error catches
    
    content = content.replace(/catch \((error|err|e)\) \{(\s*setSelectedSurah|\s*setSurahs|\s*setTodos|\s*setReminders|\s*setRepetitionPlans)/g, 
    "catch ($1) {\n      if (!navigator.onLine) {\n        console.log('Oflayn rejim: Amaliyot navbatga qo\\'yildi');\n        return;\n      }$2");
    
    fs.writeFileSync(filePath, content, 'utf-8');
}

['SurahList.tsx', 'Todos.tsx', 'Reminders.tsx'].forEach(file => {
    const filePath = path.join(clientSrcDir, 'pages', file);
    if (fs.existsSync(filePath)) {
        patchCatchBlocks(filePath);
        console.log('Patched', file);
    }
});
