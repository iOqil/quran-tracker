import fs from 'fs';
import path from 'path';

const filePath = path.join('c:', 'Users', 'imomn', 'Desktop', 'KuranTracker', 'client', 'src', 'pages', 'Profile.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const backupSectionRegex = /<h3 className="surah-section-title" style={{ margin: '16px 0 8px 0' }}>Ma'lumotlar Zaxira Nusxasi<\/h3>[\s\S]*?<\/div>\s*<\/div>/;

const newSection = `
          <h3 className="surah-section-title" style={{ margin: '24px 0 8px 0', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>Mobil Ilova (Android)</h3>
          <div style={{ backgroundColor: 'var(--bg-app)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Qalbimdagi Qur'on ilovasining Android (.apk) versiyasini yuklab oling. Bu orqali siz ilovani Play Market'dagi kabi telefoningizga to'g'ridan to'g'ri o'rnatishingiz, doimiy oflayn foydalanishingiz va ovozli bildirishnomalardan uzluksiz bahramand bo'lishingiz mumkin.
            </p>
            <a 
              href="/QuranTracker.apk" 
              download
              className="admin-submit-btn" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
              onClick={(e) => {
                // For now, prevent default and alert that it's being generated
                e.preventDefault();
                alert("APK fayl yaratilmoqda. Tez orada ushbu tugma orqali yuklab olishingiz mumkin bo'ladi (Capacitor yordamida build jarayoni yakunlangach).");
              }}
            >
              <Download size={18} />
              Android APK Yuklab Olish
            </a>
          </div>
        </div>
`;

content = content.replace(/(<div className="backup-buttons">[\s\S]*?<\/div>)\s*<\/div>/, `$1` + newSection);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Injected Android download button');
