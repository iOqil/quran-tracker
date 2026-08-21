import fs from 'fs';
import path from 'path';

const filePath = path.join('c:', 'Users', 'imomn', 'Desktop', 'KuranTracker', 'client', 'src', 'main.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const fetchOverride = `
// Override fetch to support mobile API URL routing
const originalFetch = window.fetch;
window.fetch = function() {
  let [resource, config] = arguments;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    resource = baseUrl + resource;
  }
  return originalFetch(resource, config);
};
`;

if (!content.includes('originalFetch')) {
  content = content.replace(/import App from '\.\/App';/, `import App from './App';\n${fetchOverride}`);
  fs.writeFileSync(filePath, content, 'utf-8');
}
