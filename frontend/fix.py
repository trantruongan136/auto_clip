import os

directory = '/Users/macbook/Documents/AutoClip/autoclip/frontend/src'
manual_fixes = {
    '批量优先级': 'Batch Priority',
    '标签页用于监控网页的网络请求，包括': "The Network tab is used to monitor the web page's network requests, including",
    '访问阿里云控制台': 'Visit Alibaba Cloud Console',
    '状态显示测试': 'Status Display Test',
    '模型名称': 'Model Name',
}

for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.ts') or filename.endswith('.tsx'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            for k, v in manual_fixes.items():
                new_content = new_content.replace(k, v)
                
            if new_content != content:
                print(f"Fixed {filename}")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
