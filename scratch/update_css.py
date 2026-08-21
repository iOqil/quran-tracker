import re

file_path = r'c:\Users\imomn\Desktop\KuranTracker\client\src\index.css'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace --bg-app first
content = content.replace('--bg-app: #FFF7F9;', '--bg-app: #FFF7F9;\n  --bg-header-rgba: rgba(255, 253, 254, 0.95);')

# Now find the end of :root
root_end = content.find('}', content.find(':root')) + 1

theme_dark_css = """
[data-theme="dark"] {
  --primary: #F48FB1;
  --primary-dark: #F8BBD0;
  --primary-light: #4A212E;
  --bg-app: #120e13;
  --bg-card: #1c151c;
  --bg-header-rgba: rgba(18, 14, 19, 0.95);
  --text-main: #f0e6f2;
  --text-muted: #ab9cab;
  --text-primary: #f0e6f2;
  --text-color: #f0e6f2;
  --border-color: #332633;
  --shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  --shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.6);
}

[data-theme="dark"] .level-0 { background-color: #241a25; }
[data-theme="dark"] .level-1 { background-color: #4a212e; }
[data-theme="dark"] .level-2 { background-color: #7d334d; }
[data-theme="dark"] .level-3 { background-color: #c9517b; }
[data-theme="dark"] .level-4 { background-color: #e85c8e; }
"""

content = content[:root_end] + "\n" + theme_dark_css + content[root_end:]

# Replace hardcoded colors with CSS variables
replacements = [
    ('background-color: #FFFFFF;', 'background-color: var(--bg-card);'),
    ('background-color: #FFFDFE;', 'background-color: var(--bg-app);'),
    ('background-color: #FFF9FA;', 'background-color: var(--bg-app);'),
    ('background-color: #FFF6F8;', 'background-color: var(--bg-app);'),
    ('background-color: rgba(255, 253, 254, 0.95);', 'background-color: var(--bg-header-rgba);'),
    ('background-color: #F8EBEE;', 'background-color: var(--border-color);'),
    ('background: #fff;', 'background: var(--bg-card);'),
]

for old, new in replacements:
    content = content.replace(old, new)

content = content.replace('background-color: #FFFFFF\n', 'background-color: var(--bg-card)\n')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS updated successfully.")
