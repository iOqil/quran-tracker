import os
import re

src_dir = r'c:\Users\imomn\Desktop\KuranTracker\client\src'

replacements = [
    (r"backgroundColor:\s*'white'", "backgroundColor: 'var(--bg-card)'"),
    (r'backgroundColor:\s*"white"', "backgroundColor: 'var(--bg-card)'"),
    (r"backgroundColor:\s*'#fff'", "backgroundColor: 'var(--bg-card)'"),
    (r'backgroundColor:\s*"#fff"', "backgroundColor: 'var(--bg-card)'"),
    (r"backgroundColor:\s*'#fff0f3'", "backgroundColor: 'var(--bg-app)'"),
    (r'backgroundColor:\s*"#fff0f3"', "backgroundColor: 'var(--bg-app)'"),
    (r"border:\s*'1px solid #ffe3e9'", "border: '1px solid var(--border-color)'"),
]

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = re.sub(old, new, new_content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file}")

