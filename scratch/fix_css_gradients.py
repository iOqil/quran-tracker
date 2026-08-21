import re

file_path = r'c:\Users\imomn\Desktop\KuranTracker\client\src\index.css'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add --bg-gradient and --bg-auth to :root
root_part = """  --bg-gradient: linear-gradient(135deg, #FFF0F5 0%, #FFF5F7 100%);
  --bg-auth: linear-gradient(135deg, #FFEBF2 0%, #FFF5F7 100%);"""
content = content.replace('--bg-header-rgba: rgba(255, 253, 254, 0.95);', '--bg-header-rgba: rgba(255, 253, 254, 0.95);\n' + root_part)

# Add --bg-gradient and --bg-auth to [data-theme="dark"]
dark_part = """  --bg-gradient: linear-gradient(135deg, #2a1620 0%, #1c151c 100%);
  --bg-auth: linear-gradient(135deg, #301723 0%, #1c151c 100%);"""
content = content.replace('--bg-header-rgba: rgba(18, 14, 19, 0.95);', '--bg-header-rgba: rgba(18, 14, 19, 0.95);\n' + dark_part)

# Replace the actual backgrounds
content = content.replace('background: linear-gradient(135deg, #FFF0F5 0%, #FFF5F7 100%);', 'background: var(--bg-gradient);')
content = content.replace('background: linear-gradient(135deg, #FFEBF2 0%, #FFF5F7 100%);', 'background: var(--bg-auth);')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS gradients updated.")
