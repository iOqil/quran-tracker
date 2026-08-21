const https = require('https');
const fs = require('fs');
const path = require('path');

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try { 
          const data = Buffer.concat(chunks).toString('utf8');
          resolve(JSON.parse(data)); 
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
};

async function downloadQuran() {
  console.log("Fetching Arabic text...");
  const arabic = await fetchJson('https://api.quran.com/api/v4/quran/verses/uthmani');
  console.log("Fetching Uzbek translations...");
  const uzbek = await fetchJson('https://api.quran.com/api/v4/quran/translations/55');
  
  if (!arabic.verses || !uzbek.translations || arabic.verses.length !== uzbek.translations.length) {
    console.error("Mismatch or missing data!");
    return;
  }

  // Structure: { [chapterId]: [ { arabic: "", translation: "" }, ... ] }
  const result = {};

  for (let i = 0; i < arabic.verses.length; i++) {
    const v = arabic.verses[i];
    const t = uzbek.translations[i];
    
    // verse_key is like "1:1" (chapter:verse)
    const chapterId = parseInt(v.verse_key.split(':')[0], 10);
    
    if (!result[chapterId]) {
      result[chapterId] = [];
    }
    
    result[chapterId].push({
      arabic: v.text_uthmani,
      translation: (t.text || '').replace(/<[^>]+>/g, '') // Strip HTML tags
    });
  }

  const outDir = path.join(__dirname, '../client/src/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'quran_uz.json');
  fs.writeFileSync(outPath, JSON.stringify(result), 'utf8');
  console.log(`Successfully saved to ${outPath}`);
}

downloadQuran();
