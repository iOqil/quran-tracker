import fs from 'fs';
import path from 'path';

const cssPath = path.join('c:', 'Users', 'imomn', 'Desktop', 'KuranTracker', 'client', 'src', 'index.css');
let cssContent = fs.readFileSync(cssPath, 'utf-8');

const mobileFixes = `
/* MOBILE HEADER FIXES */
@media (max-width: 899px) {
  .desktop-only {
    display: none !important;
  }
  .main-header {
    padding: 12px 16px !important;
  }
  .main-header-title {
    font-size: 19px !important;
    line-height: 1.2;
    white-space: nowrap;
  }
  .main-header-actions {
    gap: 4px !important;
  }
  .admin-toggle-pill {
    padding: 8px !important; 
  }
}
`;

if (!cssContent.includes('MOBILE HEADER FIXES')) {
  cssContent = cssContent + '\n' + mobileFixes;
  fs.writeFileSync(cssPath, cssContent, 'utf-8');
}

const layoutPath = path.join('c:', 'Users', 'imomn', 'Desktop', 'KuranTracker', 'client', 'src', 'components', 'Layout.tsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf-8');

layoutContent = layoutContent.replace('<span>Admin Rejimi</span>', '<span className="desktop-only">Admin Rejimi</span>');

fs.writeFileSync(layoutPath, layoutContent, 'utf-8');

console.log('Fixed mobile header UI');
