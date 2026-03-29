import os
import re
import json

directory = '/Users/macbook/Documents/AutoClip/autoclip/frontend/src'
pattern = re.compile(r'[\u4e00-\u9fa5]')

# This regex finds:
# 1. Strings in double quotes "..."
# 2. Strings in single quotes '...'
# 3. Strings in backticks `...`
# 4. Text inside JSX tags >...<
find_strings_re = re.compile(r'("([^"\\]|\\.)*"|\'([^\'\\]|\\.)*\'|`([^`\\]|\\.)*`|>([^<]+)<)')

result_set = set()

def extract_from_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Remove single line comments (rough approx)
        content_no_comments = re.sub(r'//.*', '', content)
        # Remove multiline comments
        content_no_comments = re.sub(r'/\*.*?\*/', '', content_no_comments, flags=re.DOTALL)

        matches = find_strings_re.findall(content_no_comments)
        for match in matches:
            full_match = match[0]
            # Strip the surrounding quotes or brackets
            if full_match.startswith('"') or full_match.startswith("'") or full_match.startswith("`"):
                inner_text = full_match[1:-1]
            elif full_match.startswith('>'):
                inner_text = full_match[1:-1]
            else:
                inner_text = full_match
            
            # Check if it contains Chinese
            if pattern.search(inner_text):
                # We want to replace exactly this snippet so we store inner_text
                result_set.add(inner_text.strip())

    except Exception as e:
        pass

for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.ts') or filename.endswith('.tsx'):
            filepath = os.path.join(root, filename)
            extract_from_file(filepath)

result_dict = {item: item for item in result_set if item}
print(json.dumps(result_dict, ensure_ascii=False, indent=2))
