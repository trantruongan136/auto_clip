import os
import re
import time
from googletrans import Translator

translator = Translator()
def safe_translate(text):
    if not text.strip():
        return text
    try:
        translated = translator.translate(text, src='zh-cn', dest='en').text
        return translated
    except Exception as e:
        print(f"Failed to translate: {text} - {e}")
        return text

directory = '/Users/macbook/Documents/AutoClip/autoclip/frontend/src'

pattern = re.compile(r'[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+')

# Known translations to save API calls and ensure context accuracy
manual_dict = {
    '确认': 'Confirm',
    '取消': 'Cancel',
    '保存': 'Save',
    '删除': 'Delete',
    '编辑': 'Edit',
    '成功': 'Success',
    '失败': 'Failed',
    '关闭': 'Close',
    '重试': 'Retry',
    '警告': 'Warning',
    '错误': 'Error',
    '提示': 'Hint',
    '刷新': 'Refresh',
    '状态': 'Status',
    '详情': 'Details',
    '操作': 'Action',
    '标题': 'Title',
    '描述': 'Description',
    '确定': 'OK',
    '测试连接': 'Test Connection',
    '开始处理': 'Start Processing',
    '等待中': 'Pending',
    '处理中': 'Processing',
    '已完成': 'Completed',
    '未知错误': 'Unknown error',
    '没有剩余内容': 'No content left',
    '正在按您的顺序生成合集视频': 'Generating collection video in your order',
    '合集视频生成成功，正在下载': 'Collection video generated successfully, downloading',
    '合集视频生成失败': 'Failed to generate collection video',
    '合集视频下载完成': 'Collection video downloaded successfully',
    '下载失败，请稍后重试': 'Download failed, please try again later',
    '下载失败': 'Download failed',
    '生成合集视频失败': 'Failed to generate collection video',
    '错误信息': 'Error message',
    '开始时间': 'Start Time',
    '结束时间': 'End Time',
    '完成时间': 'Completion Time',
    '创建时间': 'Creation Time',
    '更新时间': 'Updated Time',
    '最后更新': 'Last Updated',
    '任务列表': 'Task List',
    '正在处理中，请稍候': 'Processing, please wait',
    '返回首页': 'Back to Home'
}

for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.ts') or filename.endswith('.tsx'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            matches = set(pattern.findall(content))
            if not matches:
                continue

            print(f"Translating {filename} ({len(matches)} items)...")
            
            # Sort by length descending to replace longer strings first securely
            sorted_matches = sorted(list(matches), key=len, reverse=True)
            new_content = content
            for match in sorted_matches:
                # print(f"Translating: {match}")
                if match in manual_dict:
                    translated = manual_dict[match]
                else:
                    translated = safe_translate(match)
                    # Simple cache
                    manual_dict[match] = translated
                    time.sleep(0.1) # Be nice to the API

                if translated and translated != match:
                    new_content = new_content.replace(match, translated)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
